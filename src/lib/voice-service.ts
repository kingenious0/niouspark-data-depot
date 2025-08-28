export interface VoiceService {
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  isListening: () => boolean;
  isSpeaking: () => boolean;
  isSupported: () => boolean;
  setTranscriptCallback: (callback: (transcript: string) => void) => void;
}

// Type definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// Safe factory function that only runs on client side
function createVoiceService(): VoiceService | null {
  if (typeof window === 'undefined') return null;

  let recognition: SpeechRecognition | null = null;
  let synthesis: SpeechSynthesis | null = null;
  let isListeningState = false;
  let isSpeakingState = false;
  let onTranscript: ((transcript: string) => void) | null = null;

  // Initialize speech services only when needed
  const initializeSpeechServices = () => {
    try {
      // Initialize speech synthesis
      if (window.speechSynthesis) {
        synthesis = window.speechSynthesis;
      }

      // Initialize speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const newRecognition = new SpeechRecognition();
        newRecognition.lang = 'en-US';
        newRecognition.interimResults = false;
        newRecognition.continuous = false;

        newRecognition.onstart = () => {
          isListeningState = true;
        };

        newRecognition.onend = () => {
          isListeningState = false;
        };

        newRecognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          if (onTranscript) {
            onTranscript(transcript);
          }
        };

        newRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          isListeningState = false;
        };

        recognition = newRecognition;
      }
    } catch (error) {
      console.warn('Failed to initialize speech services:', error);
    }
  };

  return {
    startListening: async () => {
      if (!recognition) {
        initializeSpeechServices();
        if (!recognition) {
          throw new Error('Speech recognition not supported in this browser');
        }
      }

      // Stop any ongoing speech
      if (synthesis && synthesis.speaking) {
        synthesis.cancel();
        isSpeakingState = false;
      }

      try {
        recognition!.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        throw error;
      }
    },

    stopListening: () => {
      if (recognition && isListeningState) {
        try {
          recognition.stop();
        } catch (error) {
          console.warn('Error stopping speech recognition:', error);
        }
        isListeningState = false;
      }
    },

    speak: async (text: string) => {
      if (!synthesis) {
        initializeSpeechServices();
        if (!synthesis) {
          throw new Error('Speech synthesis not supported in this browser');
        }
      }

      // Stop any ongoing speech
      if (synthesis.speaking) {
        synthesis.cancel();
      }

      return new Promise((resolve, reject) => {
        try {
          const utterance = new (window as any).SpeechSynthesisUtterance(text);
          utterance.lang = 'en-US';
          utterance.rate = 0.9; // Slightly slower for clarity
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          utterance.onstart = () => {
            isSpeakingState = true;
          };

          utterance.onend = () => {
            isSpeakingState = false;
            resolve();
          };

          utterance.onerror = (event: any) => {
            console.error('Speech synthesis error:', event.error);
            isSpeakingState = false;
            reject(new Error(`Speech synthesis failed: ${event.error}`));
          };

          synthesis!.speak(utterance);
        } catch (error) {
          console.error('Failed to create speech utterance:', error);
          reject(error);
        }
      });
    },

    isListening: () => isListeningState,
    isSpeaking: () => isSpeakingState,
    isSupported: () => {
      if (typeof window === 'undefined') return false;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      return !!SpeechRecognition && !!window.speechSynthesis;
    },

    setTranscriptCallback: (callback: (transcript: string) => void) => {
      onTranscript = callback;
    }
  };
}

// Create and export a singleton instance (only on client side)
let voiceServiceInstance: VoiceService | null = null;

export const voiceService: VoiceService = {
  startListening: async () => {
    if (!voiceServiceInstance) {
      voiceServiceInstance = createVoiceService();
    }
    if (!voiceServiceInstance) {
      throw new Error('Voice service not available');
    }
    return voiceServiceInstance.startListening();
  },

  stopListening: () => {
    if (voiceServiceInstance) {
      voiceServiceInstance.stopListening();
    }
  },

  speak: async (text: string) => {
    if (!voiceServiceInstance) {
      voiceServiceInstance = createVoiceService();
    }
    if (!voiceServiceInstance) {
      throw new Error('Voice service not available');
    }
    return voiceServiceInstance.speak(text);
  },

  isListening: () => {
    return voiceServiceInstance?.isListening() || false;
  },

  isSpeaking: () => {
    return voiceServiceInstance?.isSpeaking() || false;
  },

  isSupported: () => {
    if (typeof window === 'undefined') return false;
    if (!voiceServiceInstance) {
      voiceServiceInstance = createVoiceService();
    }
    return voiceServiceInstance?.isSupported() || false;
  },

  setTranscriptCallback: (callback: (transcript: string) => void) => {
    if (voiceServiceInstance) {
      voiceServiceInstance.setTranscriptCallback(callback);
    }
  }
};

// Export a function to trigger speech (for use in chat components)
export const triggerSpeech = (text: string) => {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  voiceService.speak(text).catch((error) => {
    console.warn('Failed to trigger speech:', error);
  });
};
