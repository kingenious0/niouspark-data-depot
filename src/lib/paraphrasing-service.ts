import { ai } from '@/ai/genkit';
import { WORD_LIMIT, type Tone, type Mode, type HumanizationPersona, HUMANIZATION_PERSONAS } from '@/lib/constants';
import { humanizeText, advancedHumanizeText, ultraHumanizeText, analyzeHumanLikeness, addUltraAggressiveTouches } from '@/lib/humanization';
import { WEPEnhancedHumanization } from '@/lib/wep-enhanced-humanization';
import { enhanceParaphraseWithPuter } from '@/lib/puter-ai';

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
  humanLikenessAnalysis?: any;
  enhancementProvider?: 'gemini' | 'puter' | 'hybrid';
  puterEnhanced?: boolean;
}

/**
 * Count words in text (simple implementation)
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Generate advanced humanization prompt based on mode and tone
 */
function generatePrompt(text: string, mode: string, tone: string): string {
  // Select persona based on tone
  const persona = getPersonaForTone(tone);
  const personaInfo = HUMANIZATION_PERSONAS[persona];
  
  if (mode === 'humanize') {
    return generateHumanizationPrompt(text, persona, personaInfo);
  } else if (mode === 'paraphrase') {
    return generateParaphrasePrompt(text, tone);
  } else {
    return generateSimplificationPrompt(text, tone);
  }
}

/**
 * Get appropriate persona based on tone
 */
function getPersonaForTone(tone: string): HumanizationPersona {
  switch (tone) {
    case 'formal':
      return 'professional';
    case 'casual':
      return 'student';
    case 'academic':
      return 'professional';
    default:
      return 'blogger';
  }
}

/**
 * Generate prompt specifically designed for AI detector resistance
 */
function generateHumanizationPrompt(text: string, persona: HumanizationPersona, personaInfo: any): string {
  return `You are a ${personaInfo.name.toLowerCase()} rewriting text to sound completely human-written and bypass AI detectors.

Your writing persona: ${personaInfo.description}
Key characteristics: ${personaInfo.characteristics.join(', ')}

CRITICAL INSTRUCTIONS for AI detector resistance:
1. VARY sentence length dramatically - mix very short sentences with longer ones
2. Use contractions naturally (don't, can't, it's, you're, etc.)
3. Add conversational elements: "You know," "Honestly," "Actually," "By the way"
4. Include subtle imperfections humans make: slight redundancy, casual transitions
5. Break AI writing patterns: avoid overly structured paragraphs
6. Use natural human connectors: "So," "Plus," "Though," "Well," instead of formal transitions
7. Add personality - write like a real person, not a robot
8. Occasionally use incomplete sentences or fragments for emphasis
9. Include hesitation markers where natural: "I mean," "you see," "well,"
10. Vary vocabulary - don't be too precise or academic unless specifically needed

Write as if you're ${getPersonaContext(persona)} explaining this to someone in person.
Maintain the original meaning but make it sound completely human-written.

DO NOT:
- Use overly formal academic language unless absolutely necessary
- Create perfectly structured, symmetrical paragraphs
- Use repetitive sentence patterns
- Sound like an AI assistant or textbook

Original text:
${text}

Rewrite this to sound like a real human wrote it:`;
}

/**
 * Generate traditional paraphrasing prompt
 */
function generateParaphrasePrompt(text: string, tone: string): string {
  const toneInstructions = {
    formal: "Use professional, polished language appropriate for business or academic contexts.",
    casual: "Use friendly, approachable language as if talking to a colleague.",
    academic: "Use scholarly language with precise terminology."
  };

  return `Rewrite the following text using different words and sentence structures while maintaining the exact same meaning.

${toneInstructions[tone as keyof typeof toneInstructions]}

Requirements:
- Keep the same meaning and information
- Use synonyms and rephrase sentences
- Maintain similar length
- Ensure clarity and readability

Original text:
${text}

Paraphrased version:`;
}

/**
 * Generate simplification prompt
 */
function generateSimplificationPrompt(text: string, tone: string): string {
  return `Simplify the following text to make it clearer and easier to understand while keeping all important information.

Make it accessible to a general audience by:
- Using simpler vocabulary where possible
- Breaking down complex sentences
- Explaining technical terms if needed
- Maintaining a ${tone} tone

Original text:
${text}

Simplified version:`;
}

/**
 * Get contextual description for persona
 */
function getPersonaContext(persona: HumanizationPersona): string {
  switch (persona) {
    case 'student':
      return 'a college student chatting with a friend';
    case 'blogger':
      return 'a blogger writing for your audience';
    case 'journalist':
      return 'a journalist with a story deadline';
    case 'professional':
      return 'a professional explaining to a colleague';
    default:
      return 'someone having a conversation';
  }
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

    // Try Puter AI enhancement first (for browser environments)
    let paraphrasedText: string;
    let enhancementProvider: 'gemini' | 'puter' | 'hybrid' = 'gemini';
    let puterEnhanced = false;

    // Note: Puter AI works client-side, so for server-side processing, we use Gemini
    // Client-side enhancement will be available in the frontend
    try {
      if (typeof window !== 'undefined') {
        // Browser environment - try Puter AI first
        const puterResult = await enhanceParaphraseWithPuter(text, mode, tone);
        if (puterResult.success && puterResult.paraphrasedText) {
          paraphrasedText = puterResult.paraphrasedText;
          enhancementProvider = 'puter';
          puterEnhanced = true;
          console.log('✅ Puter AI enhancement successful');
        } else {
          throw new Error('Puter AI enhancement failed, falling back to Gemini');
        }
      } else {
        throw new Error('Server environment, using Gemini');
      }
    } catch (puterError) {
      console.log('ℹ️ Using Gemini AI (Puter not available or failed):', (puterError as Error).message);
      
      // Fallback to Gemini API through Genkit
      const response = await ai.generate(prompt);
      paraphrasedText = response.text?.trim();

      if (!paraphrasedText) {
        throw new Error('No response received from AI service');
      }
    }

    // Apply advanced humanization for maximum AI detector resistance
    if (mode === 'humanize') {
      console.log(`Applying ULTRA humanization with ${tone} tone for maximum AI detector resistance`);
      paraphrasedText = ultraHumanizeText(paraphrasedText, getPersonaForTone(tone));

      // Apply WEP-enhanced humanization for authentic human patterns
      try {
        const wepHumanizer = new WEPEnhancedHumanization();
        await wepHumanizer.initialize();
        
        paraphrasedText = await wepHumanizer.humanizeWithWEPPatterns(paraphrasedText, {
          useWEPPatterns: true,
          patternIntensity: 'aggressive',
          maintainOriginalMeaning: true,
          addPersonalTouch: true,
          emotionalResonance: true
        });
        
        console.log('🎯 Applied WEP dataset patterns for authentic human writing');
      } catch (error) {
        console.warn('⚠️ WEP enhancement failed, continuing with standard humanization:', error);
      }

      // Analyze human-likeness after ultra processing
      const humanLikeness = analyzeHumanLikeness(paraphrasedText);
      console.log(`Human-likeness analysis: Score ${humanLikeness.score}, Factors:`, humanLikeness.factors);
    }

    // Apply ULTRA-AGGRESSIVE humanization for maximum detector resistance
    if (mode === 'ultra-humanize') {
      console.log(`Applying ULTRA-AGGRESSIVE humanization with ${tone} tone for MAXIMUM AI detector resistance`);
      
      // First apply ultra humanization
      paraphrasedText = ultraHumanizeText(paraphrasedText, getPersonaForTone(tone));
      
      // Then apply additional aggressive techniques
      paraphrasedText = addUltraAggressiveTouches(paraphrasedText, getPersonaForTone(tone));

      // Apply WEP-enhanced humanization with maximum intensity for authentic human patterns
      try {
        const wepHumanizer = new WEPEnhancedHumanization();
        await wepHumanizer.initialize();
        
        paraphrasedText = await wepHumanizer.humanizeWithWEPPatterns(paraphrasedText, {
          useWEPPatterns: true,
          patternIntensity: 'aggressive',
          maintainOriginalMeaning: true,
          addPersonalTouch: true,
          emotionalResonance: true
        });
        
        console.log('🎯 Applied WEP dataset patterns with MAXIMUM intensity for authentic human writing');
      } catch (error) {
        console.warn('⚠️ WEP enhancement failed, continuing with standard ultra-aggressive humanization:', error);
      }

      // Analyze human-likeness after ultra-aggressive processing
      const humanLikeness = analyzeHumanLikeness(paraphrasedText);
      console.log(`ULTRA-AGGRESSIVE human-likeness analysis: Score ${humanLikeness.score}, Factors:`, humanLikeness.factors);
    }

    // Apply WEP-ENHANCED humanization using authentic human writing patterns
    if (mode === 'wep-humanize') {
      console.log(`Applying WEP-ENHANCED humanization with ${tone} tone using authentic human writing patterns`);
      
      try {
        const wepHumanizer = new WEPEnhancedHumanization();
        await wepHumanizer.initialize();
        
        // Apply WEP patterns first for authentic human structure
        paraphrasedText = await wepHumanizer.humanizeWithWEPPatterns(paraphrasedText, {
          useWEPPatterns: true,
          patternIntensity: 'aggressive',
          maintainOriginalMeaning: true,
          addPersonalTouch: true,
          emotionalResonance: true
        });
        
        // Then apply standard humanization for AI detector resistance
        paraphrasedText = ultraHumanizeText(paraphrasedText, getPersonaForTone(tone));
        
        console.log('🎯 Applied WEP dataset patterns + Ultra humanization for maximum authenticity');
      } catch (error) {
        console.warn('⚠️ WEP enhancement failed, falling back to standard ultra humanization:', error);
        paraphrasedText = ultraHumanizeText(paraphrasedText, getPersonaForTone(tone));
      }

      // Analyze human-likeness after WEP-enhanced processing
      const humanLikeness = analyzeHumanLikeness(paraphrasedText);
      console.log(`WEP-ENHANCED human-likeness analysis: Score ${humanLikeness.score}, Factors:`, humanLikeness.factors);
    }

    console.log(`Paraphrasing completed. Original: ${wordCount} words, Output: ${countWords(paraphrasedText)} words`);

    return {
      success: true,
      originalText: text,
      paraphrasedText,
      wordCount,
      enhancementProvider,
      puterEnhanced
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
 * Extract text from different file types (server-side only)
 */
export async function extractTextFromFile(file: File): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Text files
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      const text = await file.text();
      return { success: true, text };
    }

    // PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      try {
        const pdf = require('pdf-parse');
        const data = await pdf(fileBuffer);
        return { success: true, text: data.text };
      } catch (error) {
        console.error('PDF parsing error:', error);
        return {
          success: false,
          error: 'Failed to extract text from PDF. The PDF might be encrypted or corrupted.'
        };
      }
    }

    // DOCX files
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        return { success: true, text: result.value };
      } catch (error) {
        console.error('DOCX parsing error:', error);
        return {
          success: false,
          error: 'Failed to extract text from DOCX file. The file might be corrupted or password-protected.'
        };
      }
    }

    return {
      success: false,
      error: `Unsupported file type: ${fileType}. Please use TXT, PDF, or DOCX files.`
    };

  } catch (error) {
    console.error('File extraction error:', error);
    return {
      success: false,
      error: `Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

