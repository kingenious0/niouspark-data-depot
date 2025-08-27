import { NextRequest, NextResponse } from "next/server";
import { paraphraseText, type ParaphraseRequest } from "@/lib/paraphrasing-service";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { VALID_TONES, VALID_MODES } from "@/lib/constants";
import { analyzeHumanLikeness } from "@/lib/humanization";

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
    if (!VALID_TONES.includes(tone as any)) {
      return NextResponse.json({ error: `Invalid tone. Must be: ${VALID_TONES.join(', ')}` }, { status: 400 });
    }
    
    if (!VALID_MODES.includes(mode as any)) {
      return NextResponse.json({ error: `Invalid mode. Must be: ${VALID_MODES.join(', ')}` }, { status: 400 });
    }

    console.log(`User ${userId} requesting paraphrasing (${mode}, ${tone})`);

    // Process the text with Gemini (first pass)
    const result = await paraphraseText({ text, tone, mode });

    // Apply second-pass humanization with free open-source model for enhanced modes
    if (result.success && result.paraphrasedText && (mode === 'humanize' || mode === 'wep-humanize')) {
      try {
        console.log('🔄 Applying second-pass humanization with FLAN-T5-large...');
        
        const secondPassResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/second-pass`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: result.paraphrasedText }),
        });

        if (secondPassResponse.ok) {
          const secondPassResult = await secondPassResponse.json();
          if (secondPassResult.final) {
            result.paraphrasedText = secondPassResult.final;
            result.secondPassApplied = true;
            result.secondPassModel = secondPassResult.model;
            console.log('✅ Second-pass humanization completed successfully');
          }
        } else {
          console.warn('⚠️ Second-pass humanization failed, using Gemini output as fallback');
          result.secondPassApplied = false;
        }
      } catch (error) {
        console.warn('⚠️ Second-pass humanization error, using Gemini output as fallback:', error);
        result.secondPassApplied = false;
      }
    }

    // Log usage for analytics (don't await to avoid slowing response)
    if (result.success) {
      logParaphraseUsage(userId, result.wordCount, mode, tone);
    }

    // Add human-likeness analysis for 'humanize' mode
    if (result.success && (mode === 'humanize' || mode === 'wep-humanize') && result.paraphrasedText) {
      const humanLikeness = analyzeHumanLikeness(result.paraphrasedText);
      result.humanLikenessAnalysis = humanLikeness;
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
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tone = (formData.get('tone') as string) || 'casual';
    const mode = (formData.get('mode') as string) || 'paraphrase';

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Maximum file size is 10MB." 
      }, { status: 400 });
    }

    // Validate tone and mode
    if (!VALID_TONES.includes(tone as any)) {
      return NextResponse.json({ error: `Invalid tone. Must be: ${VALID_TONES.join(', ')}` }, { status: 400 });
    }
    
    if (!VALID_MODES.includes(mode as any)) {
      return NextResponse.json({ error: `Invalid mode. Must be: ${VALID_MODES.join(', ')}` }, { status: 400 });
    }

    console.log(`User ${userId} uploading file: ${file.name} (${file.size} bytes)`);

    // Extract text from file
    const { extractTextFromFile } = await import('@/lib/paraphrasing-service');
    const extractResult = await extractTextFromFile(file);

    if (!extractResult.success || !extractResult.text) {
      return NextResponse.json({ 
        success: false,
        error: extractResult.error || 'Failed to extract text from file'
      }, { status: 400 });
    }

    console.log(`Extracted ${extractResult.text.length} characters from ${file.name}`);

    // Process the extracted text with Gemini (first pass)
    const result = await paraphraseText({ 
      text: extractResult.text, 
      tone: tone as any, 
      mode: mode as any 
    });

    // Apply second-pass humanization with free open-source model for enhanced modes
    if (result.success && result.paraphrasedText && (mode === 'humanize' || mode === 'wep-humanize')) {
      try {
        console.log('🔄 Applying second-pass humanization with FLAN-T5-large for file upload...');
        
        const secondPassResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/second-pass`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: result.paraphrasedText }),
        });

        if (secondPassResponse.ok) {
          const secondPassResult = await secondPassResponse.json();
          if (secondPassResult.final) {
            result.paraphrasedText = secondPassResult.final;
            result.secondPassApplied = true;
            result.secondPassModel = secondPassResult.model;
            console.log('✅ Second-pass humanization completed successfully for file upload');
          }
        } else {
          console.warn('⚠️ Second-pass humanization failed for file upload, using Gemini output as fallback');
          result.secondPassApplied = false;
        }
      } catch (error) {
        console.warn('⚠️ Second-pass humanization error for file upload, using Gemini output as fallback:', error);
        result.secondPassApplied = false;
      }
    }

    // Log usage for analytics (don't await to avoid slowing response)
    if (result.success) {
      logParaphraseUsage(userId, result.wordCount, mode, tone);
    }

    // Add human-likeness analysis for 'humanize' mode
    if (result.success && (mode === 'humanize' || mode === 'wep-humanize') && result.paraphrasedText) {
      const humanLikeness = analyzeHumanLikeness(result.paraphrasedText);
      result.humanLikenessAnalysis = humanLikeness;
    }

    return NextResponse.json({
      ...result,
      fileName: file.name,
      fileSize: file.size
    });

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
