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


// Helper to clean and format Ghana phone numbers to +233XXXXXXXXX format
function cleanAndFormatGhanaPhoneNumber(phone: string): string {
    // Remove all whitespace and common punctuation
    let clean = phone.replace(/[\s\-\(\)]/g, '');
    
    // Get digits only
    let digits = clean.replace(/\D/g, '');
    
    // Normalize digits to 233XXXXXXXXX
    if (digits.startsWith('2330') && digits.length === 13) {
        digits = '233' + digits.substring(4); // Remove the extra '0' after '233'
    } else if (digits.startsWith('233') && digits.length === 12) {
        // Correct format digits (233 + 9 digits)
    } else if (digits.startsWith('0') && digits.length === 10) {
        digits = '233' + digits.substring(1); // Convert 0XXXXXXXXX to 233XXXXXXXXX
    } else if (digits.length === 9) {
        digits = '233' + digits; // Convert XXXXXXXXX to 233XXXXXXXXX
    } else if (digits.startsWith('233') && digits.length === 13 && digits[3] === '0') {
        digits = '233' + digits.substring(4); // Remove '0' if user did 2330XXXXXXXXX
    }
    
    // Validate that we have exactly +233 followed by 9 digits
    if (/^233[0-9]{9}$/.test(digits)) {
        return '+' + digits;
    }
    
    throw new Error("Invalid Ghana phone number format. Expected format: 0XXXXXXXXX or +233XXXXXXXXX.");
}

// POST handler to add a new number
export async function POST(request: NextRequest) {
    try {
        const userId = await getUserIdFromToken(request);
        const { name, number } = await request.json();

        if (!name || !number) {
            return NextResponse.json({ success: false, error: "Name and number are required." }, { status: 400 });
        }
        
        let formattedNumber = "";
        try {
            formattedNumber = cleanAndFormatGhanaPhoneNumber(number);
        } catch (err: any) {
            return NextResponse.json({ success: false, error: err.message }, { status: 400 });
        }

        const userDocRef = adminDb.collection('users').doc(userId);
        const newNumber = { name, number: formattedNumber };

        // Use FieldValue.arrayUnion to add the new number, avoiding duplicates of the exact same object
        await userDocRef.set({
            savedNumbers: FieldValue.arrayUnion(newNumber)
        }, { merge: true });

        return NextResponse.json({ success: true, message: "Number saved successfully.", number: newNumber });

    } catch (error: any) {
        console.error("Error saving number:", error);
        if (error.code === 'firestore/not-found') {
            try {
                const userId = await getUserIdFromToken(request);
                const { name, number } = await request.json();
                const formattedNumber = cleanAndFormatGhanaPhoneNumber(number);
                const newNumber = { name, number: formattedNumber };
                const userDocRef = adminDb.collection('users').doc(userId);
                await userDocRef.set({ savedNumbers: [newNumber] });
                return NextResponse.json({ success: true, message: "Number saved successfully.", number: newNumber });
            } catch (innerError: any) {
                return NextResponse.json({ success: false, error: innerError.message }, { status: 400 });
            }
        }
        if (error.message.includes("Unauthorized")) {
             return NextResponse.json({ success: false, error: error.message }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}