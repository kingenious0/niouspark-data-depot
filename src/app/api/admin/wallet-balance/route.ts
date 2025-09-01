import { NextResponse } from "next/server";
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { headers } from 'next/headers';
import { fetchWalletBalance } from '@/lib/datamart';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Verify authentication using the same pattern as working endpoints
    const authorization = headers().get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No auth token provided.' }, { status: 401 });
    }
    
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Check admin role directly from token (same as get-balance endpoint)
    if (decodedToken.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: User is not an admin.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || decodedToken.uid; // Default to requesting user if no userId provided

    // Fetch real DataMart wallet balance
    console.log("Fetching DataMart wallet balance...");
    const datamartBalance = await fetchWalletBalance();
    
    if (datamartBalance === null) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to fetch DataMart wallet balance. Please check API configuration." 
      }, { status: 500 });
    }

    console.log("DataMart balance fetched:", datamartBalance);
    console.log("🔍 Fetching transactions for admin user:", userId);

    // Get recent DataMart purchase transactions (admin purchases and all purchases)
    let datamartTransactionsSnapshot;
    try {
      // Query for admin purchase transactions first, then fallback to all purchases
      datamartTransactionsSnapshot = await adminDb
        .collection('transactions')
        .where('adminPurchase', '==', true)
        .where('type', '==', 'purchase')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
        
      // If no admin purchases found, get all purchase transactions
      if (datamartTransactionsSnapshot.empty) {
        console.log("No admin purchases found, fetching all purchase transactions");
        datamartTransactionsSnapshot = await adminDb
          .collection('transactions')
          .where('type', '==', 'purchase')
          .orderBy('createdAt', 'desc')
          .limit(20)
          .get();
      }
    } catch (firestoreError) {
      console.warn("Firestore orderBy query failed, trying without orderBy:", firestoreError);
      try {
        // Fallback: query without orderBy if index doesn't exist
        datamartTransactionsSnapshot = await adminDb
          .collection('transactions')
          .where('adminPurchase', '==', true)
          .where('type', '==', 'purchase')
          .limit(20)
          .get();
          
        // If no admin purchases found, get all purchase transactions
        if (datamartTransactionsSnapshot.empty) {
          datamartTransactionsSnapshot = await adminDb
            .collection('transactions')
            .where('type', '==', 'purchase')
            .limit(20)
            .get();
        }
      } catch (fallbackError) {
        console.error("Firestore fallback query also failed:", fallbackError);
        // If both queries fail, return data without transactions
        return NextResponse.json({ 
          success: true, 
          data: {
            datamartBalance,
            totalTransactions: 0,
            recentTransactions: []
          }
        });
      }
    }

    // Format transactions for the new DataMart-focused dashboard
    const recentTransactions = datamartTransactionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'purchase',
        amount: data.amount,
        description: `${data.bundleName || 'Data Bundle'} - ${data.phoneNumber || data.phone || 'N/A'}`,
        network: data.network,
        bundleName: data.bundleName,
        phoneNumber: data.phoneNumber || data.phone, // Handle both field names
        status: data.status,
        reference: data.reference,
        datamartTransactionId: data.datamartTransactionRef || data.datamartTransactionId || data.reference,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      };
    });

    const totalTransactions = datamartTransactionsSnapshot.size;
    
    console.log("📊 Transaction query results:", {
      totalFound: totalTransactions,
      adminPurchases: recentTransactions.filter(t => t.type === 'purchase').length,
      sampleTransaction: recentTransactions[0] || 'No transactions found'
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        datamartBalance,
        totalTransactions,
        recentTransactions,
        isDatamartMirrored: true // Flag to indicate this is real DataMart data
      }
    });

  } catch (err: any) {
    console.error("🔥 Get wallet balance error:", err);
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    
    // More specific error messages
    let errorMessage = "Internal Server Error";
    if (err.code === 'auth/id-token-expired') {
      errorMessage = "Authentication token expired. Please log in again.";
    } else if (err.code === 'auth/argument-error') {
      errorMessage = "Invalid authentication token.";
    } else if (err.message?.includes('permission')) {
      errorMessage = "Insufficient permissions to access wallet data.";
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}
