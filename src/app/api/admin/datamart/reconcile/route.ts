import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import {
  reconcileTransactionOrderStatus,
  getDatamartOrderStatus,
} from '@/lib/datamart-order-status';
import { isTerminalDatamartStatus } from '@/lib/datamart-util';

export const dynamic = 'force-dynamic';

/**
 * Admin-triggered reconciliation: re-syncs local transaction order statuses
 * against the DataMart order-status API. Read-only against DataMart — never
 * initiates a second purchase. Local terminal states are never regressed.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  }

  let userId: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    userId = decoded.uid;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
  }

  const userRecord = await adminAuth.getUser(userId);
  if (userRecord.customClaims?.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Access denied. Admin role required.' }, { status: 403 });
  }

  const url = new URL(req.url);
  const requestedLimit = parseInt(url.searchParams.get('limit') || '50', 10);
  const limit = Math.min(Math.max(requestedLimit || 50, 1), 200);

  // Query on the single `createdAt` field (auto single-field index) and filter
  // for DataMart orders in code — `where('datamartOrderReference', '!=', null)`
  // combined with orderBy requires a Firestore composite index.
  const snap = await adminDb
    .collection('transactions')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  const candidates = snap.docs.filter((doc) => doc.data().datamartOrderReference);

  let reconciled = 0;
  let skipped = 0;
  let failed = 0;
  const errors: Array<{ id: string; reason: string }> = [];

  for (const doc of candidates) {
    const data = doc.data();
    const currentStatus = data.datamartOrderStatus || data.status;

    if (currentStatus && isTerminalDatamartStatus(currentStatus)) {
      skipped += 1;
      continue;
    }

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
        reconciled += 1;
      } else {
        skipped += 1;
      }
    } catch (error: any) {
      failed += 1;
      errors.push({ id: doc.id, reason: error?.message || 'unknown' });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      scanned: candidates.length,
      reconciled,
      skipped,
      failed,
      errors,
    },
  });
}
