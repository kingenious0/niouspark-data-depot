import { NextResponse } from "next/server";
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
  let docRef;
  try {
    const { reference, email, phone, bundleId, bundleName, amount, channel, userId } = await req.json();

    console.log("📥 Incoming charge request:", { reference, email, phone, bundleId, bundleName, amount, channel, userId });
    
    // Save transaction to Firestore immediately with a pending status
    const initialTransactionData: any = {
      reference,
      userId: userId || null,
      email,
      bundleId,
      bundleName,
      amount: amount / 100, // Convert from kobo to cedis for DB
      channel,
      status: 'pending', // Initial status
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      network: bundleId.split('-')[0],
    };

    if (phone) {
        initialTransactionData.phone = phone;
    }

    docRef = await adminDb.collection('transactions').add(initialTransactionData);
    console.log("📦 Initial transaction saved with pending status:", docRef.id);

    // Determine the callback URL based on user role
    let callback_url_base = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}`;
    let callback_url = `${callback_url_base}/account?payment_status=true`; // Default for regular users

    if (userId) {
        try {
            const userRecord = await adminAuth.getUser(userId);
            const userRole = userRecord.customClaims?.role;
            if (userRole === 'admin') {
                callback_url = `${callback_url_base}/admin`; // Admins go back to the dashboard
                console.log(`User is admin, setting callback to: ${callback_url}`);
            }
        } catch (error) {
            console.warn(`Could not fetch user role for ${userId}, using default callback.`, error);
        }
    }

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference,
        email,
        amount, // This is still in kobo for Paystack
        currency: 'GHS',
        callback_url,
        channels: channel === "mobile_money" ? ["mobile_money"] : ["card"],
        metadata: { bundleId, bundleName, phone, firestoreDocId: docRef.id, userId },
      }),
    });

    const data = await paystackRes.json();
    console.log("💳 Paystack init response:", data);

    if (!paystackRes.ok || !data.status) {
       // If Paystack fails, update our transaction to 'failed'
       await docRef.update({ status: 'failed', updatedAt: Timestamp.now() });
      return NextResponse.json({ success: false, error: data.message || "Charge initiation failed" }, { status: 400 });
    }
    
    // On successful initialization, the status remains 'pending'.
    // The webhook will handle the update to 'completed' or 'failed'.
    console.log(`Transaction ${docRef.id} successfully initialized with Paystack. Status remains 'pending'.`);


    return NextResponse.json({ success: true, data: data.data });
  } catch (err: any) {
    console.error("🔥 Charge API error:", err);
    // If an error occurs after the doc has been created, mark it as failed.
    if(docRef) {
      await docRef.update({ status: 'failed', updatedAt: Timestamp.now(), error: err.message });
    }
    return NextResponse.json({ success: false, error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
```

---
### File: `src/app/api/paystack-webhook/route.ts`
---
```ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { deliverDataBundle } from '@/lib/datamart';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

export async function POST(req: NextRequest) {
  if (!PAYSTACK_SECRET) {
    console.error('PAYSTACK_SECRET_KEY is not set in your environment variables.');
    return NextResponse.json({ message: 'Webhook secret not configured. The app cannot verify the sender.' }, { status: 500 });
  }

  const signature = req.headers.get('x-paystack-signature');
  const body = await req.text(); // Read the raw body to verify the signature

  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex');

  if (hash !== signature) {
    console.warn('Webhook signature verification failed. Check if the secret key is correct in Paystack and your .env file.');
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
  }
  
  console.log('✅ Webhook signature verified successfully.');

  try {
    const event = JSON.parse(body);
    console.log('🪝 Received Paystack event:', event.event);

    // charge.success is the event we care about for successful payments
    if (event.event !== 'charge.success') {
        console.log(`Ignoring event '${event.event}' as it's not a successful charge.`);
        return NextResponse.json({ status: 'success', message: 'Event received but not a charge success event.' });
    }

    const { reference, status, metadata, id: transactionId } = event.data;
    const { firestoreDocId, bundleId, phone: phoneNumber } = metadata;
    const transactionsRef = adminDb.collection('transactions');
      
    // Use the firestoreDocId from metadata (best), otherwise query by reference
    let docRef;
    if (firestoreDocId) {
        console.log(`Found firestoreDocId in metadata: ${firestoreDocId}`);
        docRef = transactionsRef.doc(firestoreDocId);
    } else {
        console.log(`No firestoreDocId in metadata. Querying by reference: ${reference}`);
        const querySnapshot = await transactionsRef.where('reference', '==', reference).limit(1).get();
        if (!querySnapshot.empty) {
            docRef = querySnapshot.docs[0].ref;
            console.log(`Found transaction document by reference: ${docRef.id}`);
        }
    }

    if (!docRef) {
        console.warn(`Transaction with reference '${reference}' not found in Firestore. This might happen if the initial transaction failed to save.`);
        // Acknowledge receipt to Paystack to prevent retries for a non-existent order.
        return NextResponse.json({ status: 'success', message: 'Transaction not found but acknowledged' });
    }

    const currentDoc = await docRef.get();
    if (currentDoc.exists && currentDoc.data()?.status === 'completed') {
        console.log(`Transaction ${docRef.id} is already marked as completed. No update needed.`);
        return NextResponse.json({ status: 'success', message: 'Already completed' });
    }
    
    // 1. First, mark the transaction as paid and being delivered
    await docRef.update({
        status: 'delivering',
        updatedAt: Timestamp.now(),
        paystackData: event.data,
        paystackTransactionId: transactionId,
    });
    console.log(`Transaction ${docRef.id} status updated to 'delivering'.`);


    // 2. Attempt to deliver the data bundle using the DataMart API
    try {
        if (!phoneNumber) throw new Error("No phone number found in transaction metadata for delivery.");
        if (!bundleId) throw new Error("No bundleId found in transaction metadata for delivery.");
        
        const deliveryResult = await deliverDataBundle(phoneNumber, bundleId);

        // 3. If delivery is successful, mark transaction as 'completed'
        await docRef.update({
            status: 'completed',
            updatedAt: Timestamp.now(),
            datamartResult: deliveryResult,
        });
        console.log(`✅ Bundle delivery for ${docRef.id} successful. Transaction marked 'completed'.`);

    } catch (deliveryError: any) {
        console.error(`🔥 Data bundle delivery FAILED for transaction ${docRef.id}:`, deliveryError);
        // 4. If delivery fails, mark transaction as 'delivery_failed'
        await docRef.update({
            status: 'delivery_failed',
            updatedAt: Timestamp.now(),
            deliveryError: deliveryError.message,
        });
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('🔥 Error processing webhook:', error);
    return NextResponse.json({ message: 'Error processing webhook', error: error.message }, { status: 500 });
  }
}