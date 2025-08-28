export interface VoiceService {
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  isListening: () => boolean;
  isSpeaking: () => boolean;
  isSupported: () => boolean;
  setTranscriptCallback: (callback: (transcript: string) => void) => void;
  requestPermissions: () => Promise<boolean>;
  getPermissionStatus: () => Promise<string>;
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

// Check if we're in a secure context (HTTPS or localhost)
function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isHttps = window.location.protocol === 'https:';
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('localhost');
  
  return isHttps || isLocalhost;
}

// Request microphone permissions explicitly
async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check if permissions API is available
    if ('permissions' in navigator) {
      const permission = await (navigator as any).permissions.query({ name: 'microphone' });
      if (permission.state === 'granted') return true;
      if (permission.state === 'denied') return false;
    }
    
    // Fallback: try to get user media
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); // Release immediately
    return true;
  } catch (error) {
    console.warn('Microphone permission request failed:', error);
    return false;
  }
}

// Get current permission status
async function getMicrophonePermissionStatus(): Promise<string> {
  if (typeof window === 'undefined') return 'denied';
  
  try {
    if ('permissions' in navigator) {
      const permission = await (navigator as any).permissions.query({ name: 'microphone' });
      return permission.state;
    }
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

// Safe factory function that only runs on client side
function createVoiceService(): VoiceService | null {
  if (typeof window === 'undefined') return null;

  let recognition: SpeechRecognition | null = null;
  let synthesis: SpeechSynthesis | null = null;
  let isListeningState = false;
  let isSpeakingState = false;
  let onTranscript: ((transcript: string) => void) | null = null;
  let hasRequestedPermissions = false;

  // Initialize speech services only when needed
  const initializeSpeechServices = async () => {
    try {
      // Check secure context first
      if (!isSecureContext()) {
        console.warn('Voice features require HTTPS or localhost for security');
        return false;
      }

      // Request permissions if not already done
      if (!hasRequestedPermissions) {
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
          console.warn('Microphone permission denied - voice features disabled');
          return false;
        }
        hasRequestedPermissions = true;
      }

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
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Failed to initialize speech services:', error);
      return false;
    }
  };

  return {
    startListening: async () => {
      if (!recognition) {
        const initialized = await initializeSpeechServices();
        if (!initialized || !recognition) {
          throw new Error('Speech recognition not available. Please ensure HTTPS and microphone permissions.');
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
        const initialized = await initializeSpeechServices();
        if (!initialized || !synthesis) {
          throw new Error('Speech synthesis not available. Please ensure HTTPS and proper browser support.');
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
      
      // Check secure context
      if (!isSecureContext()) return false;
      
      // Check browser support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      return !!SpeechRecognition && !!window.speechSynthesis;
    },

    setTranscriptCallback: (callback: (transcript: string) => void) => {
      onTranscript = callback;
    },

    requestPermissions: async () => {
      return await requestMicrophonePermission();
    },

    getPermissionStatus: async () => {
      return await getMicrophonePermissionStatus();
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
  },

  requestPermissions: async () => {
    if (!voiceServiceInstance) {
      voiceServiceInstance = createVoiceService();
    }
    return voiceServiceInstance?.requestPermissions() || false;
  },

  getPermissionStatus: async () => {
    if (!voiceServiceInstance) {
      voiceServiceInstance = createVoiceService();
    }
    return voiceServiceInstance?.getPermissionStatus() || 'denied';
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
