import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { headers } from 'next/headers';
import { fetchWalletBalance } from '@/lib/datamart';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
…    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}