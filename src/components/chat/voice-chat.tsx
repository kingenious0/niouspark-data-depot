'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  AlertCircle, 
  Loader2,
  Waves,
  Settings
} from 'lucide-react';
import { getVoiceService, checkVoiceSupport, type SpeechRecognitionResult } from '@/lib/voice-service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceChatProps {
  onTranscript?: (transcript: string) => void;
  onStartListening?: () => void;
  onStopListening?: () => void;
  isDisabled?: boolean;
  className?: string;
}

export function VoiceChat({ 
  onTranscript, 
  onStartListening,
  onStopListening,
  isDisabled = false,
  className 
}: VoiceChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [supportInfo, setSupportInfo] = useState<any>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const voiceService = useRef(getVoiceService());
  const { toast } = useToast();
  const audioLevelInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const support = checkVoiceSupport();
    setIsSupported(support.isSupported);
    setSupportInfo(support);
    
    // Debug logging
    console.log('🎤 Voice Chat Component Mounted');
    console.log('Voice Support:', support);
    console.log('Browser:', support.features);
  }, []);

  // Simulate audio level visualization
  useEffect(() => {
    if (isListening) {
      audioLevelInterval.current = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
    } else {
      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current);
      }
      setAudioLevel(0);
    }
    
    return () => {
      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current);
      }
    };
  }, [isListening]);

  const startListening = () => {
    if (!isSupported || isDisabled) return;

    const success = voiceService.current.startListening({
      onStart: () => {
        setIsListening(true);
        setCurrentTranscript('');
        onStartListening?.();
        toast({
          title: "🎤 Listening...",
          description: "Speak now. I'm listening to your voice.",
        });
      },
      
      onResult: (result: SpeechRecognitionResult) => {
        setCurrentTranscript(result.transcript);
        
        if (result.isFinal) {
          onTranscript?.(result.transcript);
          setCurrentTranscript('');
        }
      },
      
      onEnd: () => {
        setIsListening(false);
        setCurrentTranscript('');
        onStopListening?.();
      },
      
      onError: (error: string) => {
        setIsListening(false);
        setCurrentTranscript('');
        toast({
          title: "Voice Error",
          description: error,
          variant: "destructive"
        });
      },
      
      onSpeechStart: () => {
        // Visual feedback when speech is detected
        setAudioLevel(80);
      },
      
      onSpeechEnd: () => {
        setAudioLevel(20);
      }
    });

    if (!success) {
      toast({
        title: "Voice Error",
        description: "Could not start voice recognition. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    voiceService.current.stopListening();
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Text-to-Speech function for AI responses
  const speakText = (text: string) => {
    if (!isSupported) {
      toast({
        title: "Voice Error",
        description: "Text-to-speech is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    // Stop any current speech
    voiceService.current.stopSpeaking();

    const success = voiceService.current.speak(text, {
      onStart: () => {
        setIsSpeaking(true);
        toast({
          title: "🔊 Speaking",
          description: "Playing AI response..."
        });
      },
      
      onEnd: () => {
        setIsSpeaking(false);
      },
      
      onError: (error: string) => {
        setIsSpeaking(false);
        toast({
          title: "Speech Error",
          description: error,
          variant: "destructive"
        });
      }
    });

    if (!success) {
      toast({
        title: "Speech Error",
        description: "Could not play audio. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopSpeaking = () => {
    voiceService.current.stopSpeaking();
    setIsSpeaking(false);
  };

  // Make speakText available to parent component
  useEffect(() => {
    (window as any).__voiceChat_speakText = speakText;
    (window as any).__voiceChat_stopSpeaking = stopSpeaking;
    
    return () => {
      delete (window as any).__voiceChat_speakText;
      delete (window as any).__voiceChat_stopSpeaking;
    };
  }, []);

  if (!isSupported) {
    return (
      <div className={cn("flex flex-col gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg", className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {supportInfo?.message || "Voice features are not supported in this browser."}
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled className="flex-1">
            <MicOff className="mr-2 h-4 w-4" />
            Voice Input Not Available
          </Button>
          <Button variant="outline" size="sm" disabled className="flex-1">
            <VolumeX className="mr-2 h-4 w-4" />
            Voice Output Not Available
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          For voice features, please use Chrome, Edge, or Firefox
        </div>
        
        {/* Debug info in production */}
        <div className="text-xs text-red-600 dark:text-red-400 text-center">
          DEBUG: Voice Chat Component Rendered (Unsupported Browser)
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg", className)}>
      {/* Voice Features Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
          🎤 Voice Chat Available
        </span>
        <span className="text-xs text-blue-600 dark:text-blue-400">
          ({supportInfo?.browser || 'Unknown Browser'})
        </span>
      </div>
      
      {/* Voice Input Section */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isListening ? "destructive" : "default"}
                size="default"
                onClick={toggleListening}
                disabled={isDisabled || isSpeaking}
                className={cn(
                  "flex-1 transition-all font-medium",
                  isListening && "animate-pulse"
                )}
              >
                {isListening ? (
                  <>
                    <div className="flex items-center mr-2">
                      <MicOff className="h-4 w-4 mr-1" />
                      <Waves className="h-3 w-3 animate-bounce" />
                    </div>
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Start Voice Input
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isListening ? 'Click to stop listening' : 'Click to start voice input'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Voice Output Control */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isSpeaking ? "destructive" : "secondary"}
                size="default"
                onClick={isSpeaking ? stopSpeaking : () => {}}
                disabled={isDisabled}
                className={cn(
                  "transition-all font-medium",
                  isSpeaking && "animate-pulse"
                )}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isSpeaking ? 'Stop speaking' : 'AI responses will be spoken aloud'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Voice Status Indicators */}
      {(isListening || isSpeaking) && (
        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {isListening && (
              <>
                <Badge variant="outline" className="animate-pulse">
                  🎤 Listening
                </Badge>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1 bg-primary transition-all duration-100",
                        audioLevel > i * 20 ? "h-4" : "h-1"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
            
            {isSpeaking && (
              <Badge variant="outline" className="animate-pulse">
                🔊 Speaking
              </Badge>
            )}
          </div>
          
          {supportInfo?.browser && (
            <Badge variant="secondary" className="text-xs">
              {supportInfo.browser}
            </Badge>
          )}
        </div>
      )}

      {/* Live Transcript */}
      {currentTranscript && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-sm text-blue-800 dark:text-blue-200 mb-1">
            Live Transcript:
          </div>
          <div className="text-blue-900 dark:text-blue-100">
            {currentTranscript}
          </div>
        </div>
      )}

      {/* Browser Support Status */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Badge 
            variant={supportInfo?.features?.speechToText ? "default" : "destructive"} 
            className="text-xs px-1 py-0"
          >
            STT: {supportInfo?.features?.speechToText ? "✓" : "✗"}
          </Badge>
          <Badge 
            variant={supportInfo?.features?.textToSpeech ? "default" : "destructive"} 
            className="text-xs px-1 py-0"
          >
            TTS: {supportInfo?.features?.textToSpeech ? "✓" : "✗"}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Settings className="h-3 w-3" />
          <span>{supportInfo?.browser || 'Unknown'}</span>
        </div>
      </div>
      
      {/* Debug info in production */}
      <div className="text-xs text-blue-600 dark:text-blue-400 text-center">
        DEBUG: Voice Chat Component Rendered (Browser Supported) - {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

// Export utility function to trigger speech from outside the component
export const triggerSpeech = (text: string) => {
  const speakFunction = (window as any).__voiceChat_speakText;
  if (speakFunction) {
    speakFunction(text);
  }
};

export const stopSpeech = () => {
  const stopFunction = (window as any).__voiceChat_stopSpeaking;
  if (stopFunction) {
    stopFunction();
  }
};
