import { NextResponse } from "next/server";
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: Request) {
  let docRef;
  try {
    const { reference, email, phone, bundleId, bundleName, amount, channel, userId } = await req.json();

    console.log("💰 Admin wallet purchase request:", { reference, email, phone, bundleId, bundleName, amount, channel, userId });
    
    // Verify user is admin
    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

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
    const bundlePrice = amount / 100; // Convert from kobo to cedis

    console.log(`💰 Admin ${userId} wallet balance: GH₵${walletBalance}, Bundle price: GH₵${bundlePrice}`);

    // Check if wallet has sufficient balance
    if (walletBalance < bundlePrice) {
      return NextResponse.json({ 
        success: false, 
        error: "Insufficient wallet balance",
        walletBalance,
        requiredAmount: bundlePrice,
        shortfall: bundlePrice - walletBalance
      }, { status: 400 });
    }

    // Deduct amount from wallet
    const newBalance = walletBalance - bundlePrice;
    await adminDb.collection('users').doc(userId).update({
      datamat_wallet_balance: newBalance,
      updatedAt: Timestamp.now()
    });

    console.log(`💰 Wallet updated: GH₵${walletBalance} → GH₵${newBalance}`);

    // Save transaction to Firestore with completed status
    const transactionData = {
      reference,
      userId,
      email,
      bundleId,
      bundleName,
      amount: bundlePrice,
      channel: 'admin_wallet',
      status: 'completed',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      network: bundleId.split('-')[0],
      walletBalanceBefore: walletBalance,
      walletBalanceAfter: newBalance,
      paymentMethod: 'admin_wallet',
      adminPurchase: true
    };

    if (phone) {
      transactionData.phone = phone;
    }

    docRef = await adminDb.collection('transactions').add(transactionData);
    console.log("✅ Admin wallet transaction completed:", docRef.id);

    // Log the wallet transaction
    await adminDb.collection('wallet_transactions').add({
      userId,
      type: 'purchase',
      amount: bundlePrice,
      balanceBefore: walletBalance,
      balanceAfter: newBalance,
      description: `Bundle purchase: ${bundleName}`,
      transactionId: docRef.id,
      createdAt: Timestamp.now()
    });

    return NextResponse.json({ 
      success: true, 
      message: "Purchase completed successfully using admin wallet",
      data: {
        transactionId: docRef.id,
        newWalletBalance: newBalance,
        bundleName,
        amount: bundlePrice
      }
    });

  } catch (err: any) {
    console.error("🔥 Admin wallet purchase error:", err);
    
    // If an error occurs after the doc has been created, mark it as failed
    if (docRef) {
      await docRef.update({ 
        status: 'failed', 
        updatedAt: Timestamp.now(), 
        error: err.message 
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: err.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
