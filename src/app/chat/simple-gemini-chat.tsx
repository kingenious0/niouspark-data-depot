'use client';

import { useActionState, useEffect, useRef, useState, startTransition } from 'react';
import { continueConversation, ChatState } from '@/app/chat/actions';
import { useAuth } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, User, Volume2, Sparkles, MessageCircle, Send, Loader2, Mic } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        
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

export function SimpleGeminiChat() {
  const { user, loading: authLoading } = useAuth();
  const [state, formAction, isPending] = useActionState(continueConversation, getInitialState());
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.messages, mounted]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  const handleSubmit = () => {
    if (!message.trim() || isPending || !user) return;
    
    startTransition(() => {
      const formData = new FormData();
      formData.append('message', message);
      formAction(formData);
    });

    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    toast({
      title: "Message sent! 📨",
      description: `"${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <p className="text-muted-foreground">Loading NiousparkAI...</p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md mx-auto text-center p-6">
          <div className="space-y-4">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Authentication Required</h3>
              <p className="text-sm text-muted-foreground">Please log in to start chatting with NiousparkAI</p>
            </div>
            <Button onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-muted/20">
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
          
          {isPending && (
            <div className="flex items-start gap-4 max-w-4xl mx-auto py-6">
              <Avatar className="h-8 w-8 border-2 border-primary">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted/50 border rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
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
          <Card className="relative overflow-hidden bg-background border shadow-lg">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask NiousparkAI anything..."
                disabled={!user || isPending}
                className="min-h-[60px] max-h-[200px] resize-none border-0 focus:ring-0 focus:ring-offset-0 shadow-none bg-transparent text-base leading-relaxed pr-24"
                style={{ fontSize: '16px', lineHeight: '24px' }}
              />
              
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-full text-muted-foreground hover:text-foreground"
                  disabled
                  title="Voice input (coming soon)"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  disabled={!message.trim() || isPending || !user}
                  size="sm"
                  className={cn(
                    "h-9 w-9 p-0 rounded-full transition-all duration-200",
                    message.trim() && !isPending && user
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="px-4 py-2 bg-muted/30 border-t flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                <span>NiousparkAI can make mistakes. Verify important information.</span>
              </div>
              <div className="flex items-center gap-1">
                <Volume2 className="h-3 w-3" />
                <span>Voice features loading...</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
