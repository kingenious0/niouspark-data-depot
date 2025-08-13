
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