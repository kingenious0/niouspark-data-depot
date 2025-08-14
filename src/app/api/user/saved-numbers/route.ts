
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

async function getUserIdFromToken(request: NextRequest) {
    const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      throw new Error("Unauthorized: No token provided");
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.uid;
}

// GET handler to fetch saved numbers
export async function GET(request: NextRequest) {
    try {
        const userId = await getUserIdFromToken(request);
        const userDocRef = adminDb.collection('users').doc(userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return NextResponse.json({ success: true, numbers: [] });
        }
        
        const userData = userDoc.data();
        const savedNumbers = userData?.savedNumbers || [];

        return NextResponse.json({ success: true, numbers: savedNumbers });

    } catch (error: any) {
        console.error("Error fetching saved numbers:", error);
        if (error.message.includes("Unauthorized")) {
             return NextResponse.json({ success: false, error: error.message }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}


// POST handler to add a new number
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserIdFromToken(request);
        const { name, number } = await request.json();

        if (!name || !number) {
            return NextResponse.json({ success: false, error: "Name and number are required." }, { status: 400 });
        }
        
        if (!/^\+233[0-9]{9}$/.test(number)) {
            return NextResponse.json({ success: false, error: "Invalid Ghana phone number format. Must be +233XXXXXXXXX." }, { status: 400 });
        }

        const userDocRef = adminDb.collection('users').doc(userId);
        const newNumber = { name, number };

        // Use FieldValue.arrayUnion to add the new number, avoiding duplicates of the exact same object
        await userDocRef.update({
            savedNumbers: FieldValue.arrayUnion(newNumber)
        });

        return NextResponse.json({ success: true, message: "Number saved successfully.", number: newNumber });

    } catch (error: any) {
        console.error("Error saving number:", error);
        if (error.message.includes("Unauthorized")) {
             return NextResponse.json({ success: false, error: error.message }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
