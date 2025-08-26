'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { continueConversation, ChatState } from '@/app/chat/actions';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Loader2, Send, User, Terminal, MessageCircle, Volume2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { VoiceChat, triggerSpeech } from '@/components/chat/voice-chat';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { NiousparkLoading, InlineLoading } from '@/components/niouspark-loading';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} aria-label="Send message">
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
    </Button>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <NiousparkLoading 
        size="lg" 
        message="Initializing Niouspark Smart AI..." 
        showProgress={false}
      />
    </div>
  );
}

interface MessageProps {
  message: { role: 'user' | 'assistant'; content: string };
  index: number;
  isLatest: boolean;
}

function MessageBubble({ message, index, isLatest }: MessageProps) {
  const { toast } = useToast();

  const handleSpeakMessage = () => {
    if (message.role === 'assistant') {
      triggerSpeech(message.content);
    }
  };

  return (
    <div className={cn("flex items-start gap-4", message.role === 'user' ? 'justify-end' : 'justify-start')}>
      {message.role === 'assistant' && (
        <Avatar className="h-10 w-10 border-2 border-primary">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-3xl relative group",
        message.role === 'user' ? 'ml-12' : 'mr-12'
      )}>
        <div className={cn(
          "p-4 rounded-xl shadow-sm relative",
          message.role === 'user' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted border'
        )}>
          {message.role === 'assistant' ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    const isInline = !className || !language;
                    
                    return !isInline ? (
                      <div className="relative">
                        <SyntaxHighlighter
                          style={oneDark as any}
                          language={language}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2 h-8 px-2 text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(String(children));
                            toast({ title: "Copied!", description: "Code copied to clipboard." });
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    ) : (
                      <code className={cn("bg-muted px-1 py-0.5 rounded text-sm", className)} {...props}>
                        {children}
                      </code>
                    );
                  },
                  p({ children }) {
                    return <p className="mb-2 last:mb-0">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="mb-2 pl-4 space-y-1">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="mb-2 pl-4 space-y-1">{children}</ol>;
                  },
                  h1({ children }) {
                    return <h1 className="text-xl font-bold mb-2">{children}</h1>;
                  },
                  h2({ children }) {
                    return <h2 className="text-lg font-semibold mb-2">{children}</h2>;
                  },
                  h3({ children }) {
                    return <h3 className="text-base font-medium mb-1">{children}</h3>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
          
          {/* Voice play button for assistant messages */}
          {message.role === 'assistant' && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute -bottom-2 -right-2 h-6 w-6 p-0 bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleSpeakMessage}
              title="Speak this message"
            >
              <Volume2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {/* Message metadata */}
        <div className={cn(
          "flex items-center gap-2 mt-1 text-xs text-muted-foreground",
          message.role === 'user' ? 'justify-end' : 'justify-start'
        )}>
          <span>{message.role === 'assistant' ? 'Niouspark AI' : 'You'}</span>
          {isLatest && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              Latest
            </Badge>
          )}
        </div>
      </div>
      
      {message.role === 'user' && (
        <Avatar className="h-10 w-10 border">
          <AvatarFallback className="bg-background">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

const getInitialState = (): ChatState => {
  return {
    messages: [{ 
      role: 'assistant', 
      content: "Hello! I'm **Niouspark Smart AI** 🤖\n\nI can help you with:\n- Questions about Niouspark data bundles\n- General assistance and information\n- Voice conversations (try the microphone!)\n\nHow can I assist you today?" 
    }],
  };
};

export function EnhancedChatClient() {
  const { user, loading: authLoading } = useAuth();
  const [state, formAction, isPending] = useActionState(continueConversation, getInitialState());
  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (mounted) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.messages, mounted]);

  // Auto-speak AI responses when they arrive
  useEffect(() => {
    if (mounted && state.messages.length > 0) {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content !== getInitialState().messages[0].content) {
        // Small delay to ensure the message is rendered
        setTimeout(() => {
          triggerSpeech(lastMessage.content);
        }, 500);
      }
    }
  }, [state.messages, mounted]);

  const handleFormAction = (formData: FormData) => {
    if (!user) return;
    
    const message = formData.get('message') as string;
    if (!message?.trim()) return;

    formAction(formData);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleVoiceTranscript = (transcript: string) => {
    if (!transcript.trim()) return;
    
    setInputValue(transcript);
    
    // Auto-submit voice input
    const formData = new FormData();
    formData.append('message', transcript);
    handleFormAction(formData);

    toast({
      title: "Voice Message Sent! 🎤",
      description: `"${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`
    });
  };

  const handleStartListening = () => {
    inputRef.current?.blur(); // Remove focus from input
  };

  const handleStopListening = () => {
    inputRef.current?.focus(); // Return focus to input
  };

  if (!mounted) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      {/* Chat Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-8">
          {state.messages.map((message, index) => (
            <MessageBubble 
              key={`${message.role}-${index}`}
              message={message}
              index={index}
              isLatest={index === state.messages.length - 1}
            />
          ))}
          
          {/* Loading State */}
          {isPending && (
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-lg">
                <Card>
                  <CardContent className="p-4">
                    <InlineLoading text="Niouspark AI is thinking..." size="md" />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="p-4 max-w-4xl mx-auto w-full">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {/* Voice Chat Component */}
          <VoiceChat
            onTranscript={handleVoiceTranscript}
            onStartListening={handleStartListening}
            onStopListening={handleStopListening}
            isDisabled={isPending || !user || authLoading}
          />
          
          {/* Text Input Form */}
          <form ref={formRef} action={handleFormAction} className="flex items-end gap-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                type="text"
                name="message"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={user && !authLoading ? "Type your message or use voice input above..." : "Please log in to chat"}
                className="pr-12 min-h-[44px] resize-none"
                disabled={isPending || !user || authLoading}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (inputValue.trim()) {
                      const formData = new FormData();
                      formData.append('message', inputValue);
                      handleFormAction(formData);
                    }
                  }
                }}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <SubmitButton />
              </div>
            </div>
          </form>
          
          {/* Chat Status */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-3 w-3" />
              <span>Niouspark Smart AI Chat</span>
              {state.chatId && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  Session Active
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span>Press Enter to send • Voice input available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}