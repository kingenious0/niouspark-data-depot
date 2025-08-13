
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { headers } from 'next/headers';
import { fetchWalletBalance } from '@/lib/datamart';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authorization = headers().get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No auth token provided.' }, { status: 401 });
    }
    
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (decodedToken.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: User is not an admin.' }, { status: 403 });
    }

    const balance = await fetchWalletBalance();
    
    return NextResponse.json({ success: true, balance });

  } catch (error: any) {
    console.error('Failed to fetch wallet balance:', error);
    
    let errorMessage = 'Failed to fetch wallet balance due to an internal error.';
    if (error.message.includes('DATAMART_API_KEY is not configured')) {
        errorMessage = 'Server configuration error: The DataMart API key is missing.';
    } else if (error.message.includes('Failed to fetch')) {
        errorMessage = `Could not connect to DataMart API: ${error.message}`;
    }

    if (error.code?.startsWith('auth/')) {
        return NextResponse.json({ success: false, error: 'Authentication error. Please log in again.' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
