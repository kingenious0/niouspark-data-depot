import { NextRequest, NextResponse } from "next/server";
import { paraphraseText, type ParaphraseRequest } from "@/lib/paraphrasing-service";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

// For tracking usage
async function logParaphraseUsage(userId: string, wordCount: number, mode: string, tone: string) {
  try {
    await adminDb.collection('paraphrase_usage').add({
      userId,
      wordCount,
      mode,
      tone,
      timestamp: new Date(),
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Failed to log paraphrase usage:', error);
    // Don't fail the request if logging fails
  }
}

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
    const { text, tone = 'casual', mode = 'paraphrase' } = body as ParaphraseRequest;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Validate tone and mode
    const validTones = ['formal', 'casual', 'academic'];
    const validModes = ['paraphrase', 'humanize', 'simplify'];
    
    if (!validTones.includes(tone)) {
      return NextResponse.json({ error: "Invalid tone. Must be: formal, casual, or academic" }, { status: 400 });
    }
    
    if (!validModes.includes(mode)) {
      return NextResponse.json({ error: "Invalid mode. Must be: paraphrase, humanize, or simplify" }, { status: 400 });
    }

    console.log(`User ${userId} requesting paraphrasing (${mode}, ${tone})`);

    // Process the text
    const result = await paraphraseText({ text, tone, mode });

    // Log usage for analytics (don't await to avoid slowing response)
    if (result.success) {
      logParaphraseUsage(userId, result.wordCount, mode, tone);
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Error in paraphrase API:", error);
    
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error", 
      message: error.message 
    }, { status: 500 });
  }
}

// Handle file uploads for PDF/DOCX processing
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    await adminAuth.verifyIdToken(idToken);

    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tone = (formData.get('tone') as string) || 'casual';
    const mode = (formData.get('mode') as string) || 'paraphrase';

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // For now, return a placeholder response
    // TODO: Implement PDF/DOCX parsing with libraries like pdf-parse or mammoth
    return NextResponse.json({ 
      error: "File upload processing not yet implemented. Please paste text directly for now." 
    }, { status: 501 });

  } catch (error: any) {
    console.error("Error in file upload API:", error);
    
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired token" }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error", 
      message: error.message 
    }, { status: 500 });
  }
}
