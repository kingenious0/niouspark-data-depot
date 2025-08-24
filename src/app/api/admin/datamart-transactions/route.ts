import { NextResponse } from "next/server";
import { adminAuth } from '@/lib/firebase-admin';
import { datamartAPI } from '@/lib/datamart-api';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    // Verify user is admin
    const userRecord = await adminAuth.getUser(userId);
    const userRole = userRecord.customClaims?.role;
    
    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, error: "Access denied. Admin role required." }, { status: 403 });
    }

    // Check if Datamart API is configured
    if (!datamartAPI.isConfigured()) {
      return NextResponse.json({ 
        success: false, 
        error: "Datamart API not configured",
        details: "Please configure DATAMART_API_KEY environment variable"
      }, { status: 500 });
    }

    // Fetch transactions from Datamart
    const datamartTransactions = await datamartAPI.getTransactions(page, limit);

    // Also fetch our local transaction logs for admin purchases
    const { adminDb } = await import('@/lib/firebase-admin');
    const localTransactionsSnapshot = await adminDb
      .collection('transactions')
      .where('adminPurchase', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const localTransactions = localTransactionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        reference: data.reference,
        phoneNumber: data.phoneNumber,
        bundleName: data.bundleName,
        amount: data.amount,
        network: data.network,
        capacity: data.capacity,
        status: data.status,
        gateway: data.gateway,
        paymentMethod: data.paymentMethod,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        datamartPurchaseId: data.datamartPurchaseId,
        datamartTransactionRef: data.datamartTransactionRef,
        datamartRemainingBalance: data.datamartRemainingBalance
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        datamartTransactions: datamartTransactions.data,
        localAdminTransactions: localTransactions,
        pagination: datamartTransactions.data.pagination
      }
    });

  } catch (err: any) {
    console.error("🔥 Get Datamart transactions error:", err);
    
    if (err.message.includes('Failed to fetch transaction history')) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to fetch Datamart transactions",
        details: "Datamart service may be temporarily unavailable"
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: err.message || "Internal Server Error" 
    }, { status: 500 });
  }
}
