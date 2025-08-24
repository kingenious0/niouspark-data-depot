import { NextResponse } from "next/server";
import { adminAuth } from '@/lib/firebase-admin';
import { datamartAPI, DatamartPurchaseRequest } from '@/lib/datamart-api';
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { phoneNumber, network, capacity, userId, email, bundleName } = await req.json();

    console.log("🔄 Datamart purchase request:", { phoneNumber, network, capacity, userId, email, bundleName });
    
    // Validate required fields
    if (!phoneNumber || !network || !capacity) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields: phoneNumber, network, capacity" 
      }, { status: 400 });
    }

    let userRole = 'customer';
    let gateway: 'wallet' | 'paystack' = 'paystack';

    // Check if user is admin (if userId provided)
    if (userId) {
      try {
        const userRecord = await adminAuth.getUser(userId);
        userRole = userRecord.customClaims?.role || 'customer';
        
        if (userRole === 'admin') {
          gateway = 'wallet';
          console.log(`👑 Admin user ${userId} using wallet gateway`);
        } else {
          console.log(`👤 Customer user ${userId} using Paystack gateway`);
        }
      } catch (error) {
        console.warn(`Could not verify user role for ${userId}, defaulting to customer:`, error);
        userRole = 'customer';
        gateway = 'paystack';
      }
    }

    // Format phone number and network for Datamart API
    const formattedPhone = datamartAPI.constructor.formatPhoneNumber(phoneNumber);
    const datamartNetwork = datamartAPI.constructor.getNetworkIdentifier(network);

    // Prepare Datamart purchase request
    const datamartRequest: DatamartPurchaseRequest = {
      phoneNumber: formattedPhone,
      network: datamartNetwork,
      capacity,
      gateway
    };

    console.log(`🔄 Datamart API request:`, datamartRequest);

    // Make purchase request to Datamart
    const datamartResponse = await datamartAPI.purchaseBundle(datamartRequest);

    if (datamartResponse.status !== 'success') {
      throw new Error(datamartResponse.data?.message || 'Datamart purchase failed');
    }

    // Log the transaction in our database
    const transactionData = {
      reference: datamartResponse.data.transactionReference,
      userId: userId || null,
      email: email || null,
      phoneNumber: phoneNumber,
      bundleName: bundleName || `${capacity}GB ${network} Bundle`,
      amount: datamartResponse.data.price,
      network: network,
      capacity: capacity,
      status: 'completed',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      gateway: gateway,
      userRole: userRole,
      datamartPurchaseId: datamartResponse.data.purchaseId,
      datamartTransactionRef: datamartResponse.data.transactionReference,
      datamartRemainingBalance: datamartResponse.data.remainingBalance,
      paymentMethod: gateway === 'wallet' ? 'datamart_wallet' : 'paystack',
      adminPurchase: userRole === 'admin'
    };

    const transactionRef = await adminDb.collection('transactions').add(transactionData);
    console.log("✅ Transaction logged in database:", transactionRef.id);

    // Return success response
    if (gateway === 'wallet') {
      // Admin wallet purchase - return success immediately
      return NextResponse.json({
        success: true,
        message: "Bundle purchased successfully using Datamart wallet",
        data: {
          transactionId: transactionRef.id,
          datamartPurchaseId: datamartResponse.data.purchaseId,
          remainingBalance: datamartResponse.data.remainingBalance,
          bundleName: bundleName || `${capacity}GB ${network} Bundle`,
          phoneNumber: phoneNumber,
          network: network,
          amount: datamartResponse.data.price
        }
      });
    } else {
      // Customer Paystack purchase - return Paystack redirect URL
      // This will be handled by the existing Paystack flow
      return NextResponse.json({
        success: true,
        message: "Bundle purchase initiated, redirecting to Paystack",
        data: {
          transactionId: transactionRef.id,
          requiresPayment: true,
          amount: datamartResponse.data.price,
          phoneNumber: phoneNumber,
          network: network,
          capacity: capacity
        }
      });
    }

  } catch (err: any) {
    console.error("🔥 Datamart purchase error:", err);
    
    // Handle specific Datamart errors
    if (err.message.includes('Insufficient wallet balance')) {
      return NextResponse.json({ 
        success: false, 
        error: "Insufficient Datamart wallet balance",
        details: "Please top up your Datamart wallet to continue"
      }, { status: 402 });
    }
    
    if (err.message.includes('Invalid API key')) {
      return NextResponse.json({ 
        success: false, 
        error: "Datamart API configuration error",
        details: "Please contact support to resolve this issue"
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: false, 
      error: err.message || "Failed to process bundle purchase" 
    }, { status: 500 });
  }
}
