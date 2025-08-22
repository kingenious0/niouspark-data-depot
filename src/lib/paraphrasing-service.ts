import { ai } from '@/ai/genkit';
import { WORD_LIMIT, type Tone, type Mode } from '@/lib/constants';

export interface ParaphraseRequest {
  text: string;
  tone?: Tone;
  mode?: Mode;
}

export interface ParaphraseResponse {
  success: boolean;
  originalText: string;
  paraphrasedText?: string;
  wordCount: number;
  error?: string;
}

/**
 * Count words in text (simple implementation)
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Generate paraphrasing prompt based on mode and tone
 */
function generatePrompt(text: string, mode: string, tone: string): string {
  const baseInstruction = "You are an expert writing assistant. Your task is to rewrite the following text while maintaining its original meaning and key information.";
  
  const modeInstructions = {
    paraphrase: "Paraphrase the text using different words and sentence structures while keeping the same meaning.",
    humanize: "Rewrite the text to sound more natural, conversational, and human-like. Remove any robotic or AI-generated patterns.",
    simplify: "Simplify the text to make it clearer and easier to understand while maintaining all important information."
  };

  const toneInstructions = {
    formal: "Use formal, professional language appropriate for academic or business contexts.",
    casual: "Use casual, friendly language as if explaining to a friend.",
    academic: "Use scholarly, academic language with precise terminology and complex sentence structures."
  };

  return `${baseInstruction}

${modeInstructions[mode as keyof typeof modeInstructions]}

${toneInstructions[tone as keyof typeof toneInstructions]}

Important requirements:
- Maintain the original meaning and all key information
- Keep the same general length as the original
- Use natural, flowing language
- Avoid repetitive phrasing
- Ensure the output sounds human-written, not AI-generated
- Do not add new information not present in the original
- Preserve any technical terms that are essential to the meaning

Original text to rewrite:

${text}

Rewritten text:`;
}

/**
 * Paraphrase text using Gemini API
 */
export async function paraphraseText(request: ParaphraseRequest): Promise<ParaphraseResponse> {
  try {
    const { text, tone = 'casual', mode = 'paraphrase' } = request;
    
    // Validate input
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        originalText: text,
        wordCount: 0,
        error: 'Text cannot be empty'
      };
    }

    const wordCount = countWords(text);
    
    // Check word limit
    if (wordCount > WORD_LIMIT) {
      return {
        success: false,
        originalText: text,
        wordCount,
        error: `Text exceeds the ${WORD_LIMIT} word limit. Current: ${wordCount} words.`
      };
    }

    // Generate appropriate prompt
    const prompt = generatePrompt(text, mode, tone);

    console.log(`Paraphrasing ${wordCount} words using Gemini (mode: ${mode}, tone: ${tone})`);

    // Call Gemini API through Genkit
    const response = await ai.generate(prompt);
    const paraphrasedText = response.text?.trim();

    if (!paraphrasedText) {
      throw new Error('No response received from AI service');
    }

    console.log(`Paraphrasing completed. Original: ${wordCount} words, Output: ${countWords(paraphrasedText)} words`);

    return {
      success: true,
      originalText: text,
      paraphrasedText,
      wordCount
    };

  } catch (error) {
    console.error('Paraphrasing error:', error);
    
    return {
      success: false,
      originalText: request.text,
      wordCount: countWords(request.text),
      error: error instanceof Error ? error.message : 'An unexpected error occurred during paraphrasing'
    };
  }
}

/**
 * Extract text from different file types
 */
export async function extractTextFromFile(file: File): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // Text files
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      const text = await file.text();
      return { success: true, text };
    }

    // For now, we'll support only TXT files on the frontend
    // PDF and DOCX parsing will be added in the backend API endpoint
    
    return {
      success: false,
      error: `File type not supported for client-side processing: ${fileType}. Please use the server upload feature.`
    };

  } catch (error) {
    console.error('File extraction error:', error);
    return {
      success: false,
      error: `Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

