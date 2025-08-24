import { NextResponse } from "next/server";
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    // Verify user is admin
    const userRecord = await adminAuth.getUser(userId);
    const userRole = userRecord.customClaims?.role;
    
    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, error: "Access denied. Admin role required." }, { status: 403 });
    }

    // Get admin's wallet balance
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const walletBalance = userData?.datamat_wallet_balance || 0;

    // Get recent wallet transactions
    const walletTransactionsSnapshot = await adminDb
      .collection('wallet_transactions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const recentTransactions = walletTransactionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        amount: data.amount,
        description: data.description,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        walletBalance,
        recentTransactions
      }
    });

  } catch (err: any) {
    console.error("🔥 Get wallet balance error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
