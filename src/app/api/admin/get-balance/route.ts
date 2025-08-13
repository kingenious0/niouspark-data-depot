
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { headers } from 'next/headers';
import { fetchWalletBalance } from '@/lib/datamart';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authorization = headers().get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (decodedToken.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const balance = await fetchWalletBalance();
    
    return NextResponse.json({ success: true, balance });

  } catch (error: any) {
    console.error('Failed to fetch wallet balance:', error);
    if (error.code?.startsWith('auth/')) {
        return NextResponse.json({ success: false, error: 'Authentication error.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch wallet balance' }, { status: 500 });
  }
}
