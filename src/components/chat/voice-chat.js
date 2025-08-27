"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VoiceChat({ onSendMessage, onSpeak, isDisabled = false }) {
  const [listening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition = 
      typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    
    const hasSpeechRecognition = !!SpeechRecognition;
    const hasSpeechSynthesis = typeof window !== "undefined" && !!window.speechSynthesis;
    
    setIsVoiceSupported(hasSpeechRecognition && hasSpeechSynthesis);
    
    if (hasSpeechSynthesis) {
      synthesisRef.current = window.speechSynthesis;
    }
  }, []);

  const startListening = () => {
    if (!isVoiceSupported || isDisabled) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    // Stop any ongoing speech
    if (synthesisRef.current && synthesisRef.current.speaking) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = "en-US";
    recognitionRef.current.interimResults = false;
    recognitionRef.current.continuous = false;

    recognitionRef.current.onstart = () => setListening(true);

    recognitionRef.current.onend = () => setListening(false);

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("User said:", transcript);

      // Send transcript to parent (AI request)
      onSendMessage(transcript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
      if (event.error === 'not-allowed') {
        alert("Please allow microphone access to use voice chat.");
      }
    };

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const speak = (text) => {
    if (!synthesisRef.current || isDisabled) return;

    // Stop any ongoing speech
    if (synthesisRef.current.speaking) {
      synthesisRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error);
      setIsSpeaking(false);
    };

    try {
      synthesisRef.current.speak(utterance);
      // Also call parent's onSpeak if provided
      if (onSpeak) {
        onSpeak(text);
      }
    } catch (error) {
      console.error("Failed to speak:", error);
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

  // Expose speak method to parent
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.voiceChatSpeak = speak;
    }
  }, []);

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
