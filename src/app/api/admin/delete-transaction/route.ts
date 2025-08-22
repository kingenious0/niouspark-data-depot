import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;

if (!SUPER_ADMIN_EMAIL) {
    console.warn("SUPER_ADMIN_EMAIL is not set in environment variables. Individual transaction deletion will be disabled.");
}

export async function DELETE(request: NextRequest) {
  try {
    const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check if the user is the designated Super Admin
    if (!SUPER_ADMIN_EMAIL || decodedToken.email !== SUPER_ADMIN_EMAIL) {
        return NextResponse.json({ error: "Forbidden: Only the Super Admin can delete individual transaction records." }, { status: 403 });
    }

    const { transactionId } = await request.json();
    
    if (!transactionId) {
        return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    console.log(`Super Admin user ${decodedToken.uid} (${decodedToken.email}) initiated deletion of transaction ${transactionId}.`);
    
    // Check if transaction exists before deleting
    const transactionRef = adminDb.collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();
    
    if (!transactionDoc.exists) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    
    // Delete the transaction
    await transactionRef.delete();

    console.log(`Transaction ${transactionId} successfully deleted by Super Admin.`);

    return NextResponse.json({ 
        success: true, 
        message: `Transaction ${transactionId} has been deleted.`,
        deletedTransactionId: transactionId
    });

  } catch (error: any) {
    console.error("Error in delete-transaction API:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
