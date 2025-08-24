import { NextResponse } from "next/server";
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { userId, amount, description } = await req.json();

    console.log("💰 Admin wallet topup request:", { userId, amount, description });
    
    // Verify user is admin
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    const userRecord = await adminAuth.getUser(userId);
    const userRole = userRecord.customClaims?.role;
    
    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, error: "Access denied. Admin role required." }, { status: 403 });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount. Must be greater than 0." }, { status: 400 });
    }

    // Get current wallet balance
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const currentBalance = userData?.datamat_wallet_balance || 0;
    const newBalance = currentBalance + amount;

    console.log(`💰 Wallet topup: GH₵${currentBalance} → GH₵${newBalance} (+GH₵${amount})`);

    // Update wallet balance
    await adminDb.collection('users').doc(userId).update({
      datamat_wallet_balance: newBalance,
      updatedAt: Timestamp.now()
    });

    // Log the wallet transaction
    const walletTransactionRef = await adminDb.collection('wallet_transactions').add({
      userId,
      type: 'topup',
      amount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      description: description || 'Wallet topup',
      createdAt: Timestamp.now()
    });

    console.log("✅ Wallet topup transaction logged:", walletTransactionRef.id);

    return NextResponse.json({ 
      success: true, 
      message: "Wallet topped up successfully",
      data: {
        transactionId: walletTransactionRef.id,
        newBalance,
        amount,
        previousBalance: currentBalance
      }
    });

  } catch (err: any) {
    console.error("🔥 Admin wallet topup error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
