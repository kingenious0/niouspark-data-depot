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

  constructor() {
    this.initializeSpeechServices();
  }

  private initializeSpeechServices() {
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
  }

  private setupRecognition() {
    if (!this.recognition) return;

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
  }

  public setTranscriptCallback(callback: (transcript: string) => void) {
    this.onTranscript = callback;
  }

  public async startListening(): Promise<void> {
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
      this.recognition.stop();
      this.isListeningState = false;
    }
  }

  public async speak(text: string): Promise<void> {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    // Stop any ongoing speech
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }

    return new Promise((resolve, reject) => {
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

      try {
        this.synthesis.speak(utterance);
      } catch (error) {
        console.error('Failed to speak:', error);
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
    return !!(this.recognition && this.synthesis);
  }
}

// Create and export a singleton instance
export const voiceService = new WebSpeechVoiceService();

// Export a function to trigger speech (for use in chat components)
export const triggerSpeech = (text: string) => {
  voiceService.speak(text).catch(console.error);
};
