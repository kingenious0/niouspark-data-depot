'use client';

/**
 * Voice Service for Speech-to-Text and Text-to-Speech functionality
 * Uses Web Speech API with graceful fallbacks for browser compatibility
 */

export interface VoiceServiceConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface VoiceServiceCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

export class VoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isSupported = false;
  private isListening = false;
  private config: VoiceServiceConfig;
  private callbacks: VoiceServiceCallbacks = {};

  constructor(config: VoiceServiceConfig = {}) {
    this.config = {
      language: 'en-US',
      continuous: false,
      interimResults: true,
      ...config
    };
    
    this.initializeServices();
  }

  private initializeServices() {
    // Check for Speech Recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }

    // Check for Speech Synthesis support
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }

    this.isSupported = !!(this.recognition && this.synthesis);
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.language;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.callbacks.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.callbacks.onEnd?.();
    };

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const result = event.results[last];
      
      this.callbacks.onResult?.({
        transcript: result[0].transcript,
        confidence: result[0].confidence,
        isFinal: result.isFinal
      });
    };

    this.recognition.onspeechstart = () => {
      this.callbacks.onSpeechStart?.();
    };

    this.recognition.onspeechend = () => {
      this.callbacks.onSpeechEnd?.();
    };

    this.recognition.onerror = (event: any) => {
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone access denied. Please check your browser settings.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred during speech recognition.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      this.callbacks.onError?.(errorMessage);
    };
  }

  // Speech-to-Text Methods
  public startListening(callbacks: VoiceServiceCallbacks = {}): boolean {
    if (!this.isSupported || !this.recognition) {
      callbacks.onError?.('Speech recognition is not supported in this browser. Please use Chrome or Edge for voice features.');
      return false;
    }

    if (this.isListening) {
      callbacks.onError?.('Already listening. Please stop first.');
      return false;
    }

    this.callbacks = callbacks;
    
    try {
      this.recognition.start();
      return true;
    } catch (error) {
      callbacks.onError?.('Failed to start speech recognition. Please try again.');
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public abortListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  // Text-to-Speech Methods
  public speak(text: string, options: {
    voice?: SpeechSynthesisVoice;
    rate?: number;
    pitch?: number;
    volume?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
  } = {}): boolean {
    if (!this.synthesis) {
      options.onError?.('Text-to-speech is not supported in this browser.');
      return false;
    }

    // Stop any ongoing speech safely
    try {
      if (this.synthesis.speaking) {
        this.synthesis.cancel();
      }
    } catch (error) {
      console.warn('Error canceling speech:', error);
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure utterance
    utterance.rate = options.rate ?? 0.9;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;
    utterance.lang = this.config.language ?? 'en-US';

    if (options.voice) {
      utterance.voice = options.voice;
    }

    // Set up event handlers
    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      options.onError?.(`Speech synthesis error: ${event.error}`);
    };

    try {
      this.synthesis.speak(utterance);
      return true;
    } catch (error) {
      options.onError?.('Failed to start text-to-speech. Please try again.');
      return false;
    }
  }

  public stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  // Voice Management
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  public getPreferredVoice(language?: string): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    const targetLang = language || this.config.language || 'en-US';
    
    // Find a voice that matches the language
    const matchingVoice = voices.find(voice => 
      voice.lang.startsWith(targetLang.split('-')[0])
    );
    
    return matchingVoice || voices[0] || null;
  }

  // Utility Methods
  public isVoiceSupported(): boolean {
    return this.isSupported;
  }

  public isSpeechRecognitionSupported(): boolean {
    return !!this.recognition;
  }

  public isSpeechSynthesisSupported(): boolean {
    return !!this.synthesis;
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public getCurrentLanguage(): string {
    return this.config.language || 'en-US';
  }

  public setLanguage(language: string): void {
    this.config.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  // Browser Detection
  public getBrowserSupport(): {
    speechRecognition: boolean;
    speechSynthesis: boolean;
    browser: string;
    recommendation?: string;
  } {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    const result = {
      speechRecognition: this.isSpeechRecognitionSupported(),
      speechSynthesis: this.isSpeechSynthesisSupported(),
      browser
    };

    // Add recommendations for better support
    if (!result.speechRecognition) {
      if (browser === 'Safari') {
        (result as any).recommendation = 'Voice input is not supported in Safari. Please use Chrome, Edge, or Firefox for voice features.';
      } else if (browser === 'Firefox') {
        (result as any).recommendation = 'Voice input has limited support in Firefox. For the best experience, please use Chrome or Edge.';
      } else {
        (result as any).recommendation = 'Voice input is not supported in this browser. Please use Chrome or Edge for voice features.';
      }
    }

    return result;
  }
}

// Singleton instance for app-wide usage
let voiceServiceInstance: VoiceService | null = null;

export function getVoiceService(config?: VoiceServiceConfig): VoiceService {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService(config);
  }
  return voiceServiceInstance;
}

// Utility function to check if voice features are available
export function checkVoiceSupport(): {
  isSupported: boolean;
  features: {
    speechToText: boolean;
    textToSpeech: boolean;
  };
  message: string;
  browser?: string;
} {
  // Enhanced production environment check
  if (typeof window === 'undefined') {
    return {
      isSupported: false,
      features: {
        speechToText: false,
        textToSpeech: false
      },
      message: 'Voice features require a browser environment.',
      browser: 'Server'
    };
  }

  try {
    const service = getVoiceService();
    const support = service.getBrowserSupport();
    
    // Additional production safety checks
    const actualSTTSupport = support.speechRecognition && (
      typeof window.SpeechRecognition !== 'undefined' || 
      typeof window.webkitSpeechRecognition !== 'undefined'
    );
    
    const actualTTSSupport = support.speechSynthesis && 
      typeof window.speechSynthesis !== 'undefined';
    
    console.log('Voice support debug:', {
      reported: support,
      actual: { stt: actualSTTSupport, tts: actualTTSSupport },
      environment: 'production'
    });
    
    return {
      isSupported: actualSTTSupport && actualTTSSupport,
      features: {
        speechToText: actualSTTSupport,
        textToSpeech: actualTTSSupport
      },
      message: support.recommendation || 'Voice features are fully supported in this browser.',
      browser: support.browser
    };
  } catch (error) {
    console.error('Voice support check failed:', error);
    return {
      isSupported: false,
      features: {
        speechToText: false,
        textToSpeech: false
      },
      message: 'Voice features are not available due to an error.',
      browser: 'Unknown'
    };
  }
}
