
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, setUserRole, countAdmins } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized: No token provided" }, { status: 401 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const requesterUid = decodedToken.uid;
    const requesterRole = decodedToken.role;

    const { userId, newRole, emailToMakeAdmin } = await request.json();

    if (!newRole || !['admin', 'customer'].includes(newRole)) {
        return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    // Scenario 1: Making the VERY FIRST admin
    if (emailToMakeAdmin) {
        const adminCount = await countAdmins();
        // Allow if no admin exists. For safety, we can also check if the requester is the one being made admin.
        if (adminCount > 0 && requesterRole !== 'admin') {
            return NextResponse.json({ error: "Forbidden: An admin already exists. New admins must be created by an existing admin." }, { status: 403 });
        }
        
        let userToUpdate;
        try {
          userToUpdate = await adminAuth.getUserByEmail(emailToMakeAdmin);
        } catch (error) {
           return NextResponse.json({ error: "User to make admin not found." }, { status: 404 });
        }

        if (!userToUpdate) {
            return NextResponse.json({ error: "User to make admin not found." }, { status: 404 });
        }
        
        // This is a special case check for the first admin. 
        // If there are no admins, the person making the request *must* be the one they are trying to make an admin.
        // This prevents a random logged-in user from making someone else the first admin.
        if (adminCount === 0 && userToUpdate.uid !== requesterUid) {
            return NextResponse.json({ error: "Forbidden: The first admin must be self-assigned." }, { status: 403 });
        }

        await setUserRole(userToUpdate.uid, newRole);
        return NextResponse.json({ success: true, message: `Role updated to ${newRole} for ${emailToMakeAdmin}` });
    }
    
    // Scenario 2: An existing admin is changing another user's role
    if (requesterRole !== 'admin') {
      return NextResponse.json({ error: "Forbidden: You do not have permission to change user roles." }, { status: 403 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: "Invalid request body: userId is required" }, { status: 400 });
    }

    await setUserRole(userId, newRole);

    return NextResponse.json({ success: true, message: `Role updated to ${newRole}` });

  } catch (error: any) {
    console.error("Error in set-role API:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }
    if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
