import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { maskPhone } from '@/lib/datamart-util';
import { isTerminalDatamartStatus } from '@/lib/datamart-util';
import { reconcileTransactionOrderStatus, getDatamartOrderStatus } from '@/lib/datamart-order-status';

export const dynamic = 'force-dynamic';

/**
 * Customer-facing order status for one of their own purchases.
 * The `reference` is the transaction reference stored on the local record
 * (displayed as #<ref> in purchase history).
 *
 * Authorization: bearer Firebase ID token. A user may only view their own order.
 * Status is opportunistically reconciled against DataMart's order-status API
 * (read-only) when the order is not yet terminal.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
  }

  // Query on the single `reference` field only (auto single-field index) and
  // enforce ownership in code — a two-field where(reference, userId) requires a
  // Firestore composite index that may not exist, which would 500 this route.
  const snap = await adminDb
    .collection('transactions')
    .where('reference', '==', reference)
    .limit(1)
    .get();

  if (snap.empty) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
  }

  const doc = snap.docs[0];
  const data = doc.data();

  if (data.userId !== uid) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
  }

  const currentStatus = data.datamartOrderStatus || data.status;
  const terminal = Boolean(currentStatus) && isTerminalDatamartStatus(currentStatus);

  // Opportunistic, read-only reconciliation against DataMart (webhook is primary).
  let source: 'webhook' | 'api' | 'local' = data.datamartStatusSource === 'api' || data.datamartStatusSource === 'webhook'
    ? data.datamartStatusSource
    : 'local';
  if (!terminal && data.datamartOrderReference) {
    try {
      const result = await reconcileTransactionOrderStatus(
        {
          id: doc.id,
          status: data.status,
          datamartOrderReference: data.datamartOrderReference,
          datamartOrderStatus: data.datamartOrderStatus,
          datamartUpdatedAt: data.datamartUpdatedAt,
        },
        getDatamartOrderStatus,
        async (id, patch) => {
          await adminDb.collection('transactions').doc(id).update(patch);
        }
      );
      if (result.reconciled) {
        source = 'api';
      }
    } catch {
      // Reconciliation is best-effort; fall back to local/webhook data.
    }
  }

  const orderStatus = data.datamartOrderStatus || data.status || 'unknown';

  return NextResponse.json({
    success: true,
    data: {
      reference,
      status: orderStatus,
      source,
      orderStatus,
      updatedAt: data.datamartUpdatedAt ?? data.updatedAt ?? null,
      phoneNumber: data.phoneNumber ? maskPhone(data.phoneNumber) : null,
      network: data.network ?? null,
      capacity: data.capacity ?? null,
      bundleName: data.bundleName ?? null,
      price: data.amount ?? null,
      processingMethod: data.datamartProcessingMethod ?? null,
    },
  });
}
