export interface VoiceService {
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  isListening: () => boolean;
  isSpeaking: () => boolean;
  isSupported: () => boolean;
}

class WebSpeechVoiceService implements VoiceService {
  private recognition: any = null;
  private synthesis: any = null;
  private isListeningState = false;
  private isSpeakingState = false;
  private onTranscript: ((transcript: string) => void) | null = null;
  private isInitialized = false;

  constructor() {
    // Don't initialize immediately - wait for client-side
    if (typeof window !== 'undefined') {
      this.initializeSpeechServices();
    }
  }

  private initializeSpeechServices() {
    if (this.isInitialized) return;
    
    try {
      // Initialize speech synthesis
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        this.synthesis = window.speechSynthesis;
      }

      // Speech recognition is not available in all browsers
      if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          this.recognition = new SpeechRecognition();
          this.setupRecognition();
        }
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize speech services:', error);
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    try {
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;
      this.recognition.continuous = false;

      this.recognition.onstart = () => {
        this.isListeningState = true;
      };

      this.recognition.onend = () => {
        this.isListeningState = false;
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (this.onTranscript) {
          this.onTranscript(transcript);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.isListeningState = false;
      };
    } catch (error) {
      console.warn('Failed to setup speech recognition:', error);
    }
  }

  public setTranscriptCallback(callback: (transcript: string) => void) {
    this.onTranscript = callback;
    
    // Initialize services if not already done
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.initializeSpeechServices();
    }
  }

  public async startListening(): Promise<void> {
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      throw new Error('Speech recognition is only available in the browser');
    }

    // Initialize if not done yet
    if (!this.isInitialized) {
      this.initializeSpeechServices();
    }

    if (!this.recognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    // Stop any ongoing speech
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel();
      this.isSpeakingState = false;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      throw error;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListeningState) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.warn('Error stopping speech recognition:', error);
      }
      this.isListeningState = false;
    }
  }

  public async speak(text: string): Promise<void> {
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      throw new Error('Speech synthesis is only available in the browser');
    }

    // Initialize if not done yet
    if (!this.isInitialized) {
      this.initializeSpeechServices();
    }

    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    // Stop any ongoing speech
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }

    return new Promise((resolve, reject) => {
      try {
        const utterance = new (window as any).SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
          this.isSpeakingState = true;
        };

        utterance.onend = () => {
          this.isSpeakingState = false;
          resolve();
        };

        utterance.onerror = (event: any) => {
          console.error('Speech synthesis error:', event.error);
          this.isSpeakingState = false;
          reject(new Error(`Speech synthesis failed: ${event.error}`));
        };

        this.synthesis.speak(utterance);
      } catch (error) {
        console.error('Failed to create speech utterance:', error);
        reject(error);
      }
    });
  }

  public isListening(): boolean {
    return this.isListeningState;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public isSupported(): boolean {
    // Only check support on the client side
    if (typeof window === 'undefined') return false;
    
    // Initialize if not done yet
    if (!this.isInitialized) {
      this.initializeSpeechServices();
    }
    
    return !!(this.recognition && this.synthesis);
  }
}

// Create and export a singleton instance
export const voiceService = new WebSpeechVoiceService();

// Export a function to trigger speech (for use in chat components)
export const triggerSpeech = (text: string) => {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  voiceService.speak(text).catch((error) => {
    console.warn('Failed to trigger speech:', error);
  });
};
