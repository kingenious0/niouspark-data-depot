import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getDatamartOrderStatus } from '@/lib/datamart-order-status';
import { safeDatamartMessage } from '@/lib/datamart-errors';

export const dynamic = 'force-dynamic';

/**
 * Admin order-status lookup for a DataMart orderReference (e.g. GN-AB12CD34).
 * Returns the live order-status from the DataMart API.
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

  try {
    const result = await getDatamartOrderStatus(reference);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error(`🔥 Datamart order-status lookup failed for ${reference}:`, error);
    const message = error?.code
      ? safeDatamartMessage(error)
      : error?.message || 'Failed to fetch order status from Datamart';
    const status = error?.httpStatus || 500;
    return NextResponse.json(
      { success: false, error: message, code: error?.code },
      { status }
    );
  }
}
