'use client';

import { useActionState, useEffect, useRef, useState, startTransition } from 'react';
import { continueConversation, ChatState } from '@/app/chat/actions';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, User, Volume2, Sparkles, MessageCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GeminiStyleInput } from '@/components/chat/gemini-style-input';
import { triggerSpeech } from '@/components/chat/voice-chat';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { NiousparkLoading, InlineLoading } from '@/components/niouspark-loading';

function getInitialState(): ChatState {
  return {
    messages: [
      {
        role: 'assistant',
        content: "Hello! I'm NiousparkAI. How can I help you today?"
      }
    ]
  };
}

interface MessageProps {
  message: { role: 'user' | 'assistant'; content: string };
  isLatest?: boolean;
}

function Message({ message, isLatest }: MessageProps) {
  const { toast } = useToast();

  const handleSpeakMessage = () => {
    if (message.role === 'assistant') {
      triggerSpeech(message.content);
    }
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied!",
      description: "Code block copied to clipboard",
    });
  };

  return (
    <div className={cn(
      "flex items-start gap-4 max-w-4xl mx-auto py-6",
      message.role === 'user' ? 'justify-end' : 'justify-start'
    )}>
      {message.role === 'assistant' && (
        <Avatar className="h-8 w-8 border-2 border-primary flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white">
            <Sparkles className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "relative group flex-1",
        message.role === 'user' ? 'ml-12' : 'mr-12'
      )}>
        {/* Message content */}
        <div className={cn(
          "rounded-2xl p-4 shadow-sm relative",
          message.role === 'user' 
            ? 'bg-primary text-primary-foreground ml-auto max-w-2xl' 
            : 'bg-muted/50 border'
        )}>
          {message.role === 'assistant' ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    
                    return !inline && match ? (
                      <div className="relative group">
                        <SyntaxHighlighter
                          style={oneDark as any}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md"
                          {...props}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 text-xs"
                          onClick={() => copyCodeToClipboard(codeString)}
                        >
                          Copy
                        </Button>
                      </div>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
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
              className="absolute -bottom-2 -right-2 h-6 w-6 p-0 bg-background border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
              onClick={handleSpeakMessage}
              title="Speak this message"
            >
              <Volume2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {/* Message metadata */}
        <div className={cn(
          "flex items-center gap-2 mt-2 text-xs text-muted-foreground",
          message.role === 'user' ? 'justify-end' : 'justify-start'
        )}>
          <span className="font-medium">
            {message.role === 'assistant' ? 'NiousparkAI' : 'You'}
          </span>
          {isLatest && (
            <Badge variant="outline" className="text-xs px-1 py-0 h-5">
              Latest
            </Badge>
          )}
        </div>
      </div>
      
      {message.role === 'user' && (
        <Avatar className="h-8 w-8 border flex-shrink-0">
          <AvatarFallback className="bg-background">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

export function GeminiStyleChatClient() {
  const { user, loading: authLoading } = useAuth();
  const [state, formAction, isPending] = useActionState(continueConversation, getInitialState());
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('🎯 Gemini Style Chat Client Debug:');
    console.log('- User:', user);
    console.log('- Auth Loading:', authLoading);
    console.log('- Is Pending:', isPending);
    console.log('- Mounted:', mounted);
  }, [user, authLoading, isPending, mounted]);

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

  const handleSubmit = (message: string) => {
    if (!user || !message.trim()) return;
    
    startTransition(() => {
      const formData = new FormData();
      formData.append('message', message);
      formAction(formData);
    });

    toast({
      title: "Message sent! 📨",
      description: `"${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`
    });
  };

  const handleVoiceTranscript = (transcript: string) => {
    toast({
      title: "Voice input received! 🎤",
      description: `"${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`
    });
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-96">
        <NiousparkLoading />
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <InlineLoading />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <MessageCircle className="h-5 w-5" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              Please log in to start chatting with NiousparkAI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                NiousparkAI
              </h1>
            </div>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Your intelligent assistant for data bundles, paraphrasing, and more
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 pb-6">
          {state.messages.map((message, index) => (
            <Message
              key={index}
              message={message}
              isLatest={index === state.messages.length - 1}
            />
          ))}
          
          {/* Loading indicator */}
          {isPending && (
            <div className="flex items-start gap-4 max-w-4xl mx-auto py-6">
              <Avatar className="h-8 w-8 border-2 border-primary">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted/50 border rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <InlineLoading />
                  <span className="text-sm text-muted-foreground">NiousparkAI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error display */}
      {state.error && (
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <MessageCircle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 border-t bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          <GeminiStyleInput
            onSubmit={handleSubmit}
            onVoiceTranscript={handleVoiceTranscript}
            isLoading={isPending}
            disabled={!user || authLoading}
            placeholder={user && !authLoading ? "Ask NiousparkAI anything..." : "Please log in to chat"}
          />
        </div>
      </div>
    </div>
  );
}
