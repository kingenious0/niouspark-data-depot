import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { exportToTxt, exportToPdf, exportToDocx, getMimeType, generateFilename } from "@/lib/export-utils";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { text, format, filename } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (!format || !['txt', 'pdf', 'docx'].includes(format)) {
      return NextResponse.json({ error: "Invalid format. Must be txt, pdf, or docx" }, { status: 400 });
    }

    console.log(`User ${userId} exporting text in ${format} format`);

    let buffer: Buffer;
    let contentType: string;
    let fileExtension: string;

    // Generate export based on format
    switch (format) {
      case 'txt':
        buffer = exportToTxt(text);
        contentType = getMimeType('txt');
        fileExtension = '.txt';
        break;
      
      case 'pdf':
        buffer = exportToPdf(text);
        contentType = getMimeType('pdf');
        fileExtension = '.pdf';
        break;
      
      case 'docx':
        buffer = await exportToDocx(text);
        contentType = getMimeType('docx');
        fileExtension = '.docx';
        break;
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Generate filename
    const exportFilename = filename || generateFilename(format as 'txt' | 'pdf' | 'docx');

    // Return file as response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${exportFilename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error("Error in export API:", error);
    
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error", 
      message: error.message 
    }, { status: 500 });
  }
}
