"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { voiceService } from "@/lib/voice-service";

interface VoiceChatProps {
  onSendMessage: (message: string) => void;
  onSpeak?: (text: string) => void;
  isDisabled?: boolean;
}

export default function VoiceChat({ onSendMessage, onSpeak, isDisabled = false }: VoiceChatProps) {
  const [listening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle SSR - only run on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check browser support on mount (client side only)
  useEffect(() => {
    if (!mounted) return;
    
    try {
      const supported = voiceService.isSupported();
      setIsVoiceSupported(supported);
      
      if (supported) {
        // Set up transcript callback
        voiceService.setTranscriptCallback((transcript) => {
          console.log("User said:", transcript);
          onSendMessage(transcript);
        });
      }
    } catch (error) {
      console.warn('Voice service not supported:', error);
      setIsVoiceSupported(false);
    }
  }, [mounted, onSendMessage]);

  const startListening = async () => {
    if (!isVoiceSupported || isDisabled || !mounted) return;

    try {
      await voiceService.startListening();
      setListening(true);
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      if (error instanceof Error && error.message.includes('not-allowed')) {
        alert("Please allow microphone access to use voice chat.");
      }
    }
  };

  const stopListening = () => {
    if (!mounted) return;
    
    try {
      voiceService.stopListening();
    } catch (error) {
      console.warn('Error stopping listening:', error);
    }
    setListening(false);
  };

  const speak = async (text: string) => {
    if (isDisabled || !mounted) return;

    try {
      setIsSpeaking(true);
      await voiceService.speak(text);
      
      // Also call parent's onSpeak if provided
      if (onSpeak) {
        onSpeak(text);
      }
    } catch (error) {
      console.error("Failed to speak:", error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const toggleListening = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Update listening state based on voice service (client side only)
  useEffect(() => {
    if (!mounted) return;
    
    const checkListeningState = () => {
      try {
        setListening(voiceService.isListening());
      } catch (error) {
        console.warn('Error checking listening state:', error);
      }
    };

    const checkSpeakingState = () => {
      try {
        setIsSpeaking(voiceService.isSpeaking());
      } catch (error) {
        console.warn('Error checking speaking state:', error);
      }
    };

    // Check states periodically
    const interval = setInterval(() => {
      checkListeningState();
      checkSpeakingState();
    }, 100);

    return () => clearInterval(interval);
  }, [mounted]);

  // Don't render anything until mounted (SSR safety)
  if (!mounted) {
    return null;
  }

  if (!isVoiceSupported) {
    return (
      <div className="flex items-center gap-2 p-2">
        <VolumeX className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Voice not supported</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={toggleListening}
        disabled={isDisabled || isSpeaking}
        variant="ghost"
        size="sm"
        className={cn(
          "h-9 w-9 p-0 rounded-full transition-all duration-200",
          listening 
            ? "bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse" 
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
        title={listening ? "Stop listening" : "Start voice input"}
      >
        {listening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {isSpeaking && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Volume2 className="h-3 w-3 animate-pulse" />
          <span>Speaking...</span>
        </div>
      )}
    </div>
  );
}

// Export the triggerSpeech function for use in other components
export { triggerSpeech } from "@/lib/voice-service";
