import { NextResponse } from "next/server";
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ success: false, error: "ID token required" }, { status: 400 });
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Get user record to access custom claims
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        role: userRecord.customClaims?.role || 'customer',
        emailVerified: userRecord.emailVerified,
        displayName: userRecord.displayName
      }
    });

  } catch (err: any) {
    console.error("🔥 Token verification error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message || "Invalid or expired token" 
    }, { status: 401 });
  }
}
