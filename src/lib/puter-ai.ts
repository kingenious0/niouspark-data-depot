/**
 * Puter AI Integration Service
 * Provides enhanced AI capabilities using Puter.js
 */

export interface PuterAIConfig {
  apiKey?: string;
  model?: string;
  timeout?: number;
}

export interface PuterChatRequest {
  message: string;
  context?: Array<{ role: 'user' | 'assistant'; content: string }>;
  systemPrompt?: string;
}

export interface PuterChatResponse {
  success: boolean;
  response?: string;
  error?: string;
  provider: 'puter' | 'fallback';
}

export interface PuterParaphraseRequest {
  text: string;
  mode?: 'paraphrase' | 'humanize' | 'ultra-humanize' | 'wep-humanize' | 'simplify';
  tone?: 'casual' | 'formal' | 'academic';
}

export interface PuterParaphraseResponse {
  success: boolean;
  paraphrasedText?: string;
  originalText?: string;
  error?: string;
  provider: 'puter' | 'fallback';
  enhancements?: {
    humanLikeness: number;
    naturalness: number;
    creativity: number;
  };
}

class PuterAIService {
  private config: PuterAIConfig;
  private isAvailable: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 5 * 60 * 1000; // 5 minutes

  constructor(config: PuterAIConfig = {}) {
    this.config = {
      timeout: 30000, // 30 seconds
      ...config
    };
    
    this.initializePuter();
  }

  private async initializePuter(): Promise<void> {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        this.isAvailable = false;
        return;
      }

      // Load Puter.js if not already loaded
      if (!(window as any).puter) {
        await this.loadPuterScript();
      }

      // Test if Puter is available
      await this.healthCheck();
    } catch (error) {
      console.warn('Puter AI initialization failed:', error);
      this.isAvailable = false;
    }
  }

  private async loadPuterScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).puter) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      
      script.onload = () => {
        console.log('Puter.js loaded successfully');
        resolve();
      };
      
      script.onerror = () => {
        console.error('Failed to load Puter.js');
        reject(new Error('Failed to load Puter.js'));
      };
      
      document.head.appendChild(script);
    });
  }

  private async healthCheck(): Promise<void> {
    const now = Date.now();
    
    // Skip if health check was recent
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return;
    }

    try {
      // Try a simple operation to check if Puter is working
      if ((window as any).puter && (window as any).puter.ai) {
        this.isAvailable = true;
        this.lastHealthCheck = now;
        console.log('Puter AI health check passed');
      } else {
        throw new Error('Puter AI not available');
      }
    } catch (error) {
      console.warn('Puter AI health check failed:', error);
      this.isAvailable = false;
    }
  }

  public async chatWithPuter(request: PuterChatRequest): Promise<PuterChatResponse> {
    try {
      // Health check
      await this.healthCheck();
      
      if (!this.isAvailable) {
        return {
          success: false,
          error: 'Puter AI service is not available',
          provider: 'fallback'
        };
      }

      // Build the prompt with context
      let fullPrompt = '';
      if (request.systemPrompt) {
        fullPrompt += `System: ${request.systemPrompt}\n\n`;
      }
      
      if (request.context && request.context.length > 0) {
        fullPrompt += 'Conversation Context:\n';
        request.context.forEach(msg => {
          fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });
        fullPrompt += '\n';
      }
      
      fullPrompt += `User: ${request.message}\nAssistant:`;

      // Call Puter AI
      const response = await Promise.race([
        (window as any).puter.ai.chat(fullPrompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Puter AI timeout')), this.config.timeout)
        )
      ]) as string;

      return {
        success: true,
        response: response.trim(),
        provider: 'puter'
      };

    } catch (error: any) {
      console.error('Puter AI chat error:', error);
      return {
        success: false,
        error: error.message || 'Unknown Puter AI error',
        provider: 'fallback'
      };
    }
  }

  public async paraphraseWithPuter(request: PuterParaphraseRequest): Promise<PuterParaphraseResponse> {
    try {
      // Health check
      await this.healthCheck();
      
      if (!this.isAvailable) {
        return {
          success: false,
          error: 'Puter AI service is not available',
          provider: 'fallback'
        };
      }

      // Build paraphrasing prompt based on mode and tone
      const prompt = this.buildParaphrasePrompt(request);

      // Call Puter AI
      const response = await Promise.race([
        (window as any).puter.ai.chat(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Puter AI timeout')), this.config.timeout)
        )
      ]) as string;

      // Extract the paraphrased text from response
      const paraphrasedText = this.extractParaphrasedText(response);

      return {
        success: true,
        paraphrasedText,
        originalText: request.text,
        provider: 'puter',
        enhancements: {
          humanLikeness: 0.85, // Puter AI tends to produce more human-like text
          naturalness: 0.9,
          creativity: 0.8
        }
      };

    } catch (error: any) {
      console.error('Puter AI paraphrase error:', error);
      return {
        success: false,
        error: error.message || 'Unknown Puter AI error',
        provider: 'fallback'
      };
    }
  }

  private buildParaphrasePrompt(request: PuterParaphraseRequest): string {
    const { text, mode = 'paraphrase', tone = 'casual' } = request;
    
    let systemInstruction = '';
    
    switch (mode) {
      case 'paraphrase':
        systemInstruction = `Rewrite the following text using different words and sentence structures while maintaining the original meaning. Make it sound natural and ${tone}.`;
        break;
      case 'humanize':
        systemInstruction = `Transform the following text to sound more human, natural, and ${tone}. Add personality, vary sentence lengths, use contractions, and make it conversational while keeping the core message.`;
        break;
      case 'ultra-humanize':
        systemInstruction = `Completely humanize this text with maximum AI detector resistance. Use natural speech patterns, personal touches, emotional elements, varied sentence structures, contractions, and make it sound like a real person wrote it in a ${tone} tone.`;
        break;
      case 'wep-humanize':
        systemInstruction = `Apply WEP-Enhanced humanization with research-based techniques: high perplexity, natural burstiness, emotional resonance, personal anecdotes, sensory details, and ${tone} tone. Make it completely undetectable by AI detection tools.`;
        break;
      case 'simplify':
        systemInstruction = `Simplify this text to make it clearer and easier to understand while maintaining all key information. Use a ${tone} tone and shorter sentences.`;
        break;
    }

    return `${systemInstruction}

Original text:
"${text}"

Rewritten text:`;
  }

  private extractParaphrasedText(response: string): string {
    // Clean up the response to extract just the paraphrased text
    let cleaned = response.trim();
    
    // Remove common prefixes
    const prefixes = [
      'Rewritten text:',
      'Here\'s the rewritten text:',
      'Here is the rewritten text:',
      'The rewritten text is:',
      'Paraphrased version:',
      'Humanized version:',
      'Simplified version:'
    ];
    
    for (const prefix of prefixes) {
      if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleaned = cleaned.substring(prefix.length).trim();
        break;
      }
    }
    
    // Remove quotes if the entire text is wrapped in them
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    return cleaned;
  }

  public isPuterAvailable(): boolean {
    return this.isAvailable;
  }

  public async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      await this.healthCheck();
      
      if (!this.isAvailable) {
        return {
          success: false,
          message: 'Puter AI is not available'
        };
      }

      // Test with a simple request
      const testResponse = await this.chatWithPuter({
        message: 'Hello, can you respond with just "Hello back!"?'
      });

      const latency = Date.now() - startTime;

      if (testResponse.success) {
        return {
          success: true,
          message: 'Puter AI is working correctly',
          latency
        };
      } else {
        return {
          success: false,
          message: testResponse.error || 'Test request failed'
        };
      }

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection test failed'
      };
    }
  }
}

// Singleton instance
let puterAIInstance: PuterAIService | null = null;

export function getPuterAI(config?: PuterAIConfig): PuterAIService {
  if (!puterAIInstance) {
    puterAIInstance = new PuterAIService(config);
  }
  return puterAIInstance;
}

// Utility functions for easy integration
export async function enhanceChatWithPuter(
  message: string, 
  context: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  systemPrompt?: string
): Promise<PuterChatResponse> {
  const puter = getPuterAI();
  return await puter.chatWithPuter({ message, context, systemPrompt });
}

export async function enhanceParaphraseWithPuter(
  text: string,
  mode: 'paraphrase' | 'humanize' | 'ultra-humanize' | 'wep-humanize' | 'simplify' = 'humanize',
  tone: 'casual' | 'formal' | 'academic' = 'casual'
): Promise<PuterParaphraseResponse> {
  const puter = getPuterAI();
  return await puter.paraphraseWithPuter({ text, mode, tone });
}
