import { NextResponse } from 'next/server';
import { fetchAllTransactionsFromAdmin } from '@/lib/firebase-admin';
import { adminAuth } from '@/lib/firebase-admin';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const authorization = headers().get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
      const idToken = authorization.split('Bearer ')[1];
      const decodedToken = await adminAuth.verifyIdToken(idToken);

      if (decodedToken.role !== 'admin') {
         return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      }
    } else {
        return NextResponse.json({ success: false, error: 'Unauthorized: No token' }, { status: 401 });
    }

    const transactions = await fetchAllTransactionsFromAdmin();
    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    if ((error as any).code === 'auth/id-token-expired') {
        return NextResponse.json({ success: false, error: 'Authentication token expired. Please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch transactions' }, { status: 500 });
  }
}