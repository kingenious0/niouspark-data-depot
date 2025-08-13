
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
