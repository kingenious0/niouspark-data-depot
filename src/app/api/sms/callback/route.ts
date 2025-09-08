import { NextRequest, NextResponse } from "next/server";
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * SMS delivery status callback from Frog SMS
 * This endpoint should be configured in your Frog SMS dashboard
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { msgid, status, destination, statusdate } = body;

    console.log('📱 SMS Callback received:', { msgid, status, destination, statusdate });

    // Log the callback to database for tracking
    await adminDb.collection('sms_callbacks').add({
      messageId: msgid,
      status: status,
      destination: destination,
      statusDate: statusdate,
      receivedAt: Timestamp.now(),
      rawData: body
    });

    // Update transaction if this SMS was related to a purchase
    if (msgid && msgid.startsWith('niouspark_')) {
      try {
        // Extract reference from message ID if possible
        const reference = msgid.split('_')[1]; // Assuming format: niouspark_REFERENCE_...
        
        const transactionQuery = await adminDb
          .collection('transactions')
          .where('reference', '==', reference)
          .limit(1)
          .get();

        if (!transactionQuery.empty) {
          const transactionDoc = transactionQuery.docs[0];
          await transactionDoc.ref.update({
            smsStatus: status,
            smsDeliveredAt: status === 'delivered' ? Timestamp.now() : null,
            updatedAt: Timestamp.now()
          });
          
          console.log(`📱 SMS status updated for transaction ${transactionDoc.id}: ${status}`);
        }
      } catch (updateError) {
        console.error('Failed to update transaction SMS status:', updateError);
      }
    }

    return NextResponse.json({ success: true, message: 'Callback processed' });
  } catch (error: any) {
    console.error('SMS callback processing error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Callback processing failed' 
    }, { status: 500 });
  }
}
