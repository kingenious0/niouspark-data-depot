
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

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
    console.log('🪝 Received Paystack event:', event.event, 'with data:', JSON.stringify(event.data, null, 2));

    // charge.success is the event we care about for successful payments
    if (event.event !== 'charge.success') {
        console.log(`Ignoring event '${event.event}' as it's not a successful charge.`);
        return NextResponse.json({ status: 'success', message: 'Event received but not a charge success event.' });
    }

    const { reference, status, metadata, id: transactionId } = event.data;
    const transactionsRef = adminDb.collection('transactions');
      
    // Use the firestoreDocId from metadata if available (best), otherwise query by reference
    let docRef;
    if (metadata && metadata.firestoreDocId) {
        console.log(`Found firestoreDocId in metadata: ${metadata.firestoreDocId}`);
        docRef = transactionsRef.doc(metadata.firestoreDocId);
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

    // Prepare update payload. Only update if the status is changing.
    const currentDoc = await docRef.get();
    if (currentDoc.exists && currentDoc.data()?.status === 'completed') {
        console.log(`Transaction ${docRef.id} is already marked as completed. No update needed.`);
        return NextResponse.json({ status: 'success', message: 'Already completed' });
    }
    
    const updatePayload: any = {
        status: 'completed', // Hardcode to 'completed' since we only process 'charge.success'
        updatedAt: Timestamp.now(),
        paystackData: event.data, // Store the full webhook payload for auditing
        paystackTransactionId: transactionId, // Store Paystack's own transaction ID
    };
    
    // Add additional metadata if it exists
    if (metadata?.userId) updatePayload.userId = metadata.userId;
    if (metadata?.phone) updatePayload.phone = metadata.phone;

    await docRef.update(updatePayload);

    console.log(`✅ Transaction ${reference} (doc: ${docRef.id}) status successfully updated to 'completed'.`);

    // TODO: Here you would trigger the actual data bundle delivery to the user
    // e.g., await deliverDataBundle(metadata.phone, metadata.bundleId);

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('🔥 Error processing webhook:', error);
    return NextResponse.json({ message: 'Error processing webhook', error: error.message }, { status: 500 });
  }
}
