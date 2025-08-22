'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { continueConversation, ChatState } from '@/app/chat/actions';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Loader2, Send, User, Terminal } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} aria-label="Send message">
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
    </Button>
  );
}

const getInitialState = (): ChatState => {
  return {
    messages: [{ role: 'assistant', content: "Hello! I'm Niouspark Smart AI. How can I help you today?" }],
  };
};

export function SimpleChatClient() {
  const { user, loading: authLoading } = useAuth();
  const [state, formAction, isPending] = useActionState(continueConversation, getInitialState());
  const [isClient, setIsClient] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.messages, isClient]);

  const handleFormAction = (formData: FormData) => {
    if (!user) return;
    
    const message = formData.get('message') as string;
    if (!message?.trim()) return;

    formAction(formData);
    formRef.current?.reset();
  };

  if (!isClient) {
    // Return a simple loading state during SSR
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
        {state.messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={cn("flex items-start gap-4", message.role === 'user' ? 'justify-end' : 'justify-start')}>
            {message.role === 'assistant' && (
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarFallback><Bot /></AvatarFallback>
              </Avatar>
            )}
            <div className={cn(
              "max-w-lg p-4 rounded-xl shadow",
              message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <Avatar className="h-10 w-10">
                <AvatarFallback><User /></AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {isPending && (
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

      {state.error && (
        <div className="p-4 border-t">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="p-4 bg-background border-t">
        <form ref={formRef} action={handleFormAction} className="flex items-center gap-2">
          <Input
            type="text"
            name="message"
            placeholder={user && !authLoading ? "Ask anything..." : "Please log in to chat"}
            className="flex-1"
            disabled={isPending || !user || authLoading}
            autoComplete="off"
          />
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
