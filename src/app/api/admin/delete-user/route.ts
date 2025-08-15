import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;

if (!SUPER_ADMIN_EMAIL) {
    console.warn("SUPER_ADMIN_EMAIL is not set in environment variables. Destructive actions will be disabled.");
}

export async function POST(request: NextRequest) {
  try {
    const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check if the requesting user is the designated Super Admin
    if (!SUPER_ADMIN_EMAIL || decodedToken.email !== SUPER_ADMIN_EMAIL) {
        return NextResponse.json({ error: "Forbidden: You do not have permission to perform this action." }, { status: 403 });
    }

    const { userIdToDelete } = await request.json();
    if (!userIdToDelete) {
      return NextResponse.json({ error: "User ID to delete is required." }, { status: 400 });
    }

    // A super admin cannot delete themselves.
    if (userIdToDelete === decodedToken.uid) {
        return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    console.log(`Super Admin ${decodedToken.uid} is attempting to delete user ${userIdToDelete}.`);
    
    // Delete user from Firebase Authentication
    await adminAuth.deleteUser(userIdToDelete);

    // Also delete the user's document from Firestore to clean up roles, etc.
    const userDocRef = adminDb.collection('users').doc(userIdToDelete);
    if ((await userDocRef.get()).exists) {
        await userDocRef.delete();
    }
    
    console.log(`Successfully deleted user ${userIdToDelete}.`);

    return NextResponse.json({ success: true, message: "User has been successfully deleted." });

  } catch (error: any) {
    console.error("Error in delete-user API:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: "User to delete was not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}