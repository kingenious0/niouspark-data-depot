
'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Loader2, Send, User, Terminal, MessageSquarePlus, X, History, Menu } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { auth } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { continueAdminConversation, type ChatState, type ChatSession, getChatSessions, getChatMessages, type ChatMessage } from '@/app/admin/ai/actions';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} aria-label="Send message">
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
    </Button>
  );
}

const initialState: ChatState = {
  chatId: null,
  messages: [
    {
      role: 'assistant',
      content:
        'Hello! I am Niouspark Smart Analyst.\n\nSelect a past conversation or start a new one. I can answer questions about sales, customers, and revenue.'
    }
  ],
  error: undefined
};

export function AdminChatClient() {
  const [actionState, formAction, isPending] = useActionState(continueAdminConversation, initialState);

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialState.messages);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);

  const [isHistoryLoading, startHistoryTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Firebase token reactivity
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          setAuthToken(token || null);
        } catch (err) {
          console.error('Error fetching auth token:', err);
          setAuthToken(null);
        }
      } else {
        setAuthToken(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authToken) {
      startHistoryTransition(async () => {
        const sessions = await getChatSessions(`Bearer ${authToken}`);
        setChatHistory(sessions);
      });
    }
  }, [authToken]);

  useEffect(() => {
    if (actionState) {
      setCurrentChatId(actionState.chatId);
      setMessages(actionState.messages);
      setError(actionState.error);
      if (actionState.newSession) {
        setChatHistory((prev) => [
          actionState.newSession!,
          ...prev.filter((s) => s.id !== actionState.newSession!.id)
        ]);
      }
    }
  }, [actionState]);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, isPending]);

  const handleFormAction = (formData: FormData) => {
    if (!formData.get('message')?.toString().trim()) return;

    if (currentChatId) formData.append('chatId', currentChatId);
    if (authToken) formData.append('authHeader', `Bearer ${authToken}`);
    formData.append('messages', JSON.stringify(messages));

    formAction(formData);
    formRef.current?.reset();
  };

  const handleSelectChat = (chatId: string) => {
    startHistoryTransition(async () => {
      if (!authToken) return;
      const fetchedMessages = await getChatMessages(chatId, `Bearer ${authToken}`);
      setCurrentChatId(chatId);
      setMessages(fetchedMessages.length > 0 ? fetchedMessages : []);
      setError(undefined);
      setSidebarOpen(false); // close on mobile after selecting
    });
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages(initialState.messages);
    setError(undefined);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-full relative">
      {/* Sidebar Backdrop (mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* History Sidebar */}
      <div
        className={cn(
          "bg-muted/40 border-r flex flex-col w-64 z-30 md:static md:translate-x-0 md:z-0 transition-transform",
          isSidebarOpen ? "translate-x-0 fixed inset-y-0 left-0" : "-translate-x-full fixed inset-y-0 left-0"
        )}
      >
        <div className="p-2 flex-shrink-0 border-b">
          <Button onClick={handleNewChat} className="w-full justify-start gap-2">
            <MessageSquarePlus className="h-4 w-4" /> New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isHistoryLoading && !chatHistory.length
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              : chatHistory.map((session) => (
                  <Button
                    key={session.id}
                    variant={currentChatId === session.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => handleSelectChat(session.id)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium truncate pr-4">{session.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </Button>
                ))}
          </div>
        </ScrollArea>
        <div className="p-2 border-t text-xs text-muted-foreground flex-shrink-0 flex items-center gap-2">
          <History className="h-4 w-4" />
          <span>Chat History</span>
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="flex flex-col flex-1">
        {/* Chat header for mobile toggle */}
        <div className="p-2 border-b flex items-center gap-2 md:hidden">
          <Button size="icon" variant="ghost" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold">Business Analyst Chat</h2>
        </div>

        {/* Scrollable messages */}
        <div ref={viewportRef} className="flex-1 min-h-0 overflow-y-auto p-4">
          <div className="space-y-6 pb-4">
            {isHistoryLoading && messages.length <= 1 ? (
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarFallback>
                    <Bot />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-lg p-4 rounded-xl bg-muted flex items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-4',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-10 w-10 border-2 border-primary">
                      <AvatarFallback>
                        <Bot />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-xl rounded-xl p-3 shadow',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            {isPending && (
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarFallback>
                    <Bot />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-lg p-4 rounded-xl bg-muted flex items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input form pinned */}
        <div className="flex-shrink-0 border-t bg-background">
          {error && (
            <div className="p-4 border-b relative">
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setError(undefined)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </Alert>
            </div>
          )}
          <div className="p-4">
            <form
              ref={formRef}
              action={handleFormAction}
              className="flex items-center gap-2"
            >
              <Input
                type="text"
                name="message"
                placeholder={
                  currentChatId
                    ? 'Continue this conversation...'
                    : 'Ask about sales, customers, revenue...'
                }
                className="flex-1"
                disabled={isPending || !authToken}
                autoComplete="off"
              />
              <SubmitButton />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}