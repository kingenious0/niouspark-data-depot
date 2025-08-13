
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

async function deleteCollection(collectionPath: string, batchSize: number) {
    const collectionRef = adminDb.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query: FirebaseFirestore.Query, resolve: (value: unknown) => void) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        // When there are no documents left, we are done
        resolve(true);
        return;
    }

    // Delete documents in a batch
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick, to avoid
    // exploding the stack.
    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}


export async function POST(request: NextRequest) {
  try {
    const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const requesterRole = decodedToken.role;

    // This is a protected endpoint, only admins can call it.
    if (requesterRole !== 'admin') {
      return NextResponse.json({ error: "Forbidden: You do not have permission to perform this action." }, { status: 403 });
    }

    console.log(`Admin user ${decodedToken.uid} initiated deletion of all transactions.`);
    
    await deleteCollection('transactions', 100);

    console.log("All transactions successfully deleted.");

    return NextResponse.json({ success: true, message: "All transactions have been deleted." });

  } catch (error: any) {
    console.error("Error in clear-transactions API:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
