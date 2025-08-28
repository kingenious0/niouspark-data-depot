'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, AlertCircle, Shield } from 'lucide-react';
import { voiceService } from '@/lib/voice-service';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VoiceChatProps {
  onSendMessage: (message: string) => void;
  isDisabled?: boolean;
}

export default function VoiceChat({ onSendMessage, isDisabled = false }: VoiceChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [isSecureContext, setIsSecureContext] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkVoiceSupport = async () => {
      try {
        // Check if we're in a secure context (HTTPS or localhost)
        const secure = typeof window !== 'undefined' && (
          window.location.protocol === 'https:' ||
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.includes('localhost')
        );
        setIsSecureContext(secure);

        if (!secure) {
          setError('Voice features require HTTPS or localhost for security');
          return;
        }

        // Check browser support
        const supported = voiceService.isSupported();
        setIsSupported(supported);

        if (!supported) {
          setError('Voice features not supported in this browser');
          return;
        }

        // Check permission status
        const permission = await voiceService.getPermissionStatus();
        setPermissionStatus(permission as any);

        // Set up transcript callback
        voiceService.setTranscriptCallback((transcript: string) => {
          if (transcript.trim()) {
            onSendMessage(transcript);
          }
        });

      } catch (error) {
        console.warn('Failed to check voice support:', error);
        setError('Failed to initialize voice features');
      }
    };

    checkVoiceSupport();
  }, [mounted, onSendMessage]);

  const requestPermissions = async () => {
    try {
      setError(null);
      const granted = await voiceService.requestPermissions();
      if (granted) {
        setPermissionStatus('granted');
      } else {
        setPermissionStatus('denied');
        setError('Microphone permission denied. Please allow microphone access in your browser settings.');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setError('Failed to request microphone permissions');
    }
  };

  const startListening = async () => {
    if (!isSupported || !isSecureContext || permissionStatus !== 'granted') {
      return;
    }

    try {
      setError(null);
      setIsListening(true);
      await voiceService.startListening();
    } catch (error: any) {
      console.error('Failed to start listening:', error);
      setError(error.message || 'Failed to start voice recognition');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    try {
      voiceService.stopListening();
      setIsListening(false);
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 rounded-full"
          disabled
          title={error}
        >
          <AlertCircle className="h-4 w-4 text-destructive" />
        </Button>
        <div className="text-xs text-destructive max-w-[120px] text-center">
          {error}
        </div>
      </div>
    );
  }

  // Show permission request
  if (permissionStatus === 'prompt' || permissionStatus === 'denied') {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 rounded-full"
          onClick={requestPermissions}
          disabled={isDisabled}
          title="Request microphone permission"
        >
          <Shield className="h-4 w-4" />
        </Button>
        <div className="text-xs text-muted-foreground max-w-[120px] text-center">
          {permissionStatus === 'denied' ? 'Permission denied' : 'Click to enable voice'}
        </div>
      </div>
    );
  }

  // Show not supported
  if (!isSupported) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 rounded-full"
          disabled
          title="Voice not supported"
        >
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </Button>
        <div className="text-xs text-muted-foreground max-w-[120px] text-center">
          Voice not supported
        </div>
      </div>
    );
  }

  // Show HTTPS warning
  if (!isSecureContext) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 rounded-full"
          disabled
          title="HTTPS required for voice features"
        >
          <Shield className="h-4 w-4 text-muted-foreground" />
        </Button>
        <div className="text-xs text-muted-foreground max-w-[120px] text-center">
          HTTPS required
        </div>
      </div>
    );
  }

  // Show main voice button
  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant={isListening ? "destructive" : "outline"}
        size="sm"
        className={`
          h-9 w-9 p-0 rounded-full transition-all duration-200
          ${isListening ? 'animate-pulse' : ''}
        `}
        onClick={handleMicClick}
        disabled={isDisabled}
        title={isListening ? "Stop listening" : "Start voice input"}
      >
        {isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      <div className="text-xs text-muted-foreground max-w-[120px] text-center">
        {isListening ? 'Listening...' : 'Voice input'}
      </div>
    </div>
  );
}

// Export the triggerSpeech function for use in other components
export { triggerSpeech } from "@/lib/voice-service";
