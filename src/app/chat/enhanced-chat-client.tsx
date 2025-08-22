'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { continueConversation, loadChatState, ChatState } from '@/app/chat/actions';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Loader2, Send, User, Terminal } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageContent } from '@/components/chat/message-content';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} aria-label="Send message">
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
    </Button>
  );
}

export function EnhancedChatClient() {
  const { user, loading: authLoading } = useAuth();
  const [chatState, setChatState] = useState<ChatState>({
    messages: [{ role: 'assistant', content: 'Loading your chat history...' }]
  });
  const [isPending, startTransition] = useTransition();
  const [formPending, setFormPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial chat state
  useEffect(() => {
    if (!authLoading && user) {
      startTransition(async () => {
        try {
          const initialState = await loadChatState();
          setChatState(initialState);
        } catch (error) {
          console.error('Failed to load chat state:', error);
          setChatState({
            messages: [{ role: 'assistant', content: "Hello! I'm Niouspark Smart AI. How can I help you today?" }],
            error: 'Failed to load chat history'
          });
        }
      });
    } else if (!authLoading && !user) {
      setChatState({
        messages: [{ role: 'assistant', content: 'Please log in to access the chat.' }],
        error: 'Authentication required'
      });
    }
  }, [user, authLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages]);

  const handleSubmit = async (formData: FormData) => {
    if (!user) return;
    
    const message = formData.get('message') as string;
    if (!message.trim()) return;

    setFormPending(true);
    formRef.current?.reset();

    // Optimistically add user message
    const userMessage = { role: 'user' as const, content: message };
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    try {
      const newState = await continueConversation(chatState, formData);
      setChatState(newState);
    } catch (error) {
      console.error('Failed to send message:', error);
      setChatState(prev => ({
        ...prev,
        error: 'Failed to send message'
      }));
    } finally {
      setFormPending(false);
    }
  };

  const handleFormAction = (formData: FormData) => {
    startTransition(() => handleSubmit(formData));
  };

  const isLoading = isPending || formPending;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
        {chatState.messages.map((message, index) => (
          <div key={index} className={cn("flex items-start gap-4", message.role === 'user' ? 'justify-end' : 'justify-start')}>
            {message.role === 'assistant' && (
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarFallback><Bot /></AvatarFallback>
              </Avatar>
            )}
            <div className={cn(
              "max-w-2xl p-4 rounded-xl shadow",
              message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}>
              <MessageContent content={message.content} role={message.role} />
            </div>
            {message.role === 'user' && (
              <Avatar className="h-10 w-10">
                <AvatarFallback><User /></AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarFallback><Bot /></AvatarFallback>
            </Avatar>
            <div className="max-w-lg p-4 rounded-xl bg-muted flex items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary"/>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {chatState.error && (
        <div className="p-4 border-t">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{chatState.error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="p-4 bg-background border-t">
        <form ref={formRef} action={handleFormAction} className="flex items-center gap-2">
          <Input
            type="text"
            name="message"
            placeholder={user ? "Ask anything..." : "Please log in to chat"}
            className="flex-1"
            disabled={isLoading || !user}
            autoComplete="off"
          />
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
