import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import {
  processDatamartWebhookEvent,
  verifyDatamartSignature,
  type DatamartWebhookEvent,
  type TransactionRecord,
} from '@/lib/datamart-webhook';

export const dynamic = 'force-dynamic';

/**
 * DataMart order webhook receiver.
 *
 * Security model:
 *  1. HMAC-SHA256 signature verified BEFORE any Firestore access.
 *  2. Events matched to local transactions by DataMart identifiers only
 *     (orderReference / purchaseId / transactionId) — never by phone.
 *  3. Processing is idempotent; unknown events and unmatched transactions are
 *     acknowledged (200) to avoid retry storms, never fabricating records.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.DATAMART_WEBHOOK_SECRET;
  if (!secret) {
    console.error('DATAMART_WEBHOOK_SECRET is not set in your environment variables.');
    return NextResponse.json(
      { message: 'Webhook secret not configured. The app cannot verify the sender.' },
      { status: 500 }
    );
  }

  const signature = req.headers.get('x-datamart-signature');
  const rawBody = await req.text(); // raw body is exactly what the HMAC was computed over

  if (!verifyDatamartSignature(rawBody, secret, signature)) {
    console.warn('⚠️ DataMart webhook signature verification failed.');
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
  }

  let body: DatamartWebhookEvent;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: 'Malformed JSON body' }, { status: 400 });
  }

  console.log('🪝 Received DataMart event:', body.event, {
    orderReference: body.data?.orderReference,
    orderId: body.data?.orderId,
  });

  const result = await processDatamartWebhookEvent(body, {
    findTransaction,
    updateTransaction,
  });

  if (!result.processed) {
    // Acknowledge to prevent retries — we intentionally never create fake
    // transactions for events we cannot match.
    console.log(`DataMart event '${body.event}' not applied (${result.reason}).`);
  } else {
    console.log(`DataMart event '${body.event}' applied -> ${result.status}.`);
  }

  return NextResponse.json({ received: true });
}

/**
 * Match a local transaction by DataMart identifiers, in priority order:
 * orderReference -> purchaseId -> transactionId. Never by phone number.
 */
async function findTransaction(event: DatamartWebhookEvent): Promise<TransactionRecord | null> {
  const data = event.data ?? {};
  const collections = adminDb.collection('transactions');

  const lookups: Array<[string, string | undefined]> = [
    ['datamartOrderReference', data.orderReference],
    ['datamartPurchaseId', data.orderId],
    ['datamartTransactionRef', data.transactionId],
  ];

  for (const [field, value] of lookups) {
    if (!value) {
      continue;
    }
    const snap = await collections.where(field, '==', value).limit(1).get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      const d = doc.data();
      return {
        id: doc.id,
        status: d.status,
        datamartOrderReference: d.datamartOrderReference,
        datamartPurchaseId: d.datamartPurchaseId,
        datamartTransactionRef: d.datamartTransactionRef,
        datamartOrderStatus: d.datamartOrderStatus,
        datamartUpdatedAt: d.datamartUpdatedAt,
        datamartLastEvent: d.datamartLastEvent,
      };
    }
  }

  return null;
}

async function updateTransaction(id: string, patch: Record<string, unknown>): Promise<void> {
  await adminDb.collection('transactions').doc(id).update({
    ...patch,
    updatedAt: Timestamp.now(),
  });
}
