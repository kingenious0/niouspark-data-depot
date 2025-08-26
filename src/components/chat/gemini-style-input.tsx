'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Mic, 
  MicOff, 
  Send, 
  Loader2,
  Waves,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getVoiceService, checkVoiceSupport, type SpeechRecognitionResult } from '@/lib/voice-service';
import { useToast } from '@/hooks/use-toast';

interface GeminiStyleInputProps {
  onSubmit: (message: string) => void;
  onVoiceTranscript?: (transcript: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function GeminiStyleInput({
  onSubmit,
  onVoiceTranscript,
  isLoading = false,
  disabled = false,
  placeholder = "Ask NiousparkAI anything...",
  className
}: GeminiStyleInputProps) {
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voiceService = useRef(getVoiceService());
  const { toast } = useToast();

  // Check voice support on mount
  useEffect(() => {
    const support = checkVoiceSupport();
    setIsVoiceSupported(support.isSupported);
    console.log('Voice support check:', support);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  // Handle form submission
  const handleSubmit = () => {
    if (!message.trim() || isLoading || disabled) return;
    
    onSubmit(message.trim());
    setMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Voice recognition handlers
  const startListening = () => {
    if (!isVoiceSupported || isListening) return;
    
    setIsListening(true);
    setCurrentTranscript('');
    
    const success = voiceService.current.startListening({
      continuous: true,
      interimResults: true,
      
      onResult: (result: SpeechRecognitionResult) => {
        if (result.isFinal) {
          setMessage(prev => prev + result.transcript + ' ');
          onVoiceTranscript?.(result.transcript);
          setCurrentTranscript('');
        } else {
          setCurrentTranscript(result.transcript);
        }
      },
      
      onEnd: () => {
        setIsListening(false);
        setCurrentTranscript('');
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
        setAudioLevel(Math.random() * 40 + 40); // Simulate audio levels
      },
      
      onSpeechEnd: () => {
        setAudioLevel(20);
      }
    });

    if (!success) {
      setIsListening(false);
      toast({
        title: "Voice Error",
        description: "Could not start voice recognition. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    voiceService.current.stopListening();
    setIsListening(false);
    setCurrentTranscript('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const displayText = message + currentTranscript;
  const hasContent = displayText.trim().length > 0;

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      {/* Voice listening indicator */}
      {isListening && (
        <Card className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Mic className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div className="absolute -inset-1 rounded-full bg-blue-600/20 animate-ping" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Listening...
                </span>
                <Waves className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-bounce" />
              </div>
              {currentTranscript && (
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  "{currentTranscript}"
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={stopListening}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <MicOff className="h-4 w-4 mr-1" />
              Stop
            </Button>
          </div>
        </Card>
      )}

      {/* Main input area */}
      <Card className="relative overflow-hidden bg-background border shadow-lg">
        <div className="relative">
          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={displayText}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              "min-h-[60px] max-h-[200px] resize-none border-0 focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent text-base leading-relaxed pr-24",
              "placeholder:text-muted-foreground/70"
            )}
            style={{ 
              fontSize: '16px', // Prevent zoom on mobile
              lineHeight: '24px'
            }}
          />
          
          {/* Right side controls */}
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            {/* Voice button */}
            {isVoiceSupported && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleListening}
                      disabled={disabled || isLoading}
                      className={cn(
                        "h-9 w-9 p-0 rounded-full transition-all duration-200",
                        isListening 
                          ? "bg-red-500 hover:bg-red-600 text-white shadow-lg" 
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isListening ? 'Stop listening' : 'Start voice input'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* Send button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSubmit}
                    disabled={!hasContent || isLoading || disabled}
                    size="sm"
                    className={cn(
                      "h-9 w-9 p-0 rounded-full transition-all duration-200",
                      hasContent && !isLoading && !disabled
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send message</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Bottom bar with voice status */}
        <div className="px-4 py-2 bg-muted/30 border-t flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            <span>NiousparkAI can make mistakes. Verify important information.</span>
          </div>
          
          {isVoiceSupported && (
            <div className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              <span>Voice ready</span>
            </div>
          )}
          
          {!isVoiceSupported && (
            <div className="flex items-center gap-1">
              <VolumeX className="h-3 w-3" />
              <span>Voice not supported</span>
            </div>
          )}
        </div>
      </Card>
      
      {/* Character count for long messages */}
      {displayText.length > 500 && (
        <div className="text-right mt-1">
          <Badge variant="outline" className="text-xs">
            {displayText.length} characters
          </Badge>
        </div>
      )}
    </div>
  );
}
