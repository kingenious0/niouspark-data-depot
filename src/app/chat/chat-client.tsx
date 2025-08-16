'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { continueConversation, ChatState } from '@/app/chat/actions'; // Changed from './actions'
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
    if (typeof window !== 'undefined') {
        const savedMessages = sessionStorage.getItem('chatMessages');
        if (savedMessages) {
            try {
                const messages = JSON.parse(savedMessages);
                if (Array.isArray(messages)) {
                    return { messages };
                }
            } catch (e) {
                console.error("Failed to parse chat messages from sessionStorage", e);
                sessionStorage.removeItem('chatMessages');
            }
        }
    }
    // Default initial state
    return {
        messages: [{ role: 'assistant', content: "Hello! I'm Niouspark Smart AI. How can I help you today?" }],
    };
};


export function ChatClient() {
  const [state, formAction, isPending] = useActionState(continueConversation, getInitialState());
  const formRef = useRef<HTMLFormElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Save messages to session storage whenever they change
    if (state.messages.length > 0) {
        sessionStorage.setItem('chatMessages', JSON.stringify(state.messages));
    }
  }, [state.messages]);

  const handleFormAction = (formData: FormData) => {
    formAction(formData);
    formRef.current?.reset();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
        {state.messages.map((message, index) => (
          <div key={index} className={cn("flex items-start gap-4", message.role === 'user' ? 'justify-end' : 'justify-start')}>
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
            placeholder="Ask anything..."
            className="flex-1"
            disabled={isPending}
            autoComplete="off"
          />
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
