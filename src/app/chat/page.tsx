"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatClient } from "./chat-client";

export function ChatPageClient() {
  return (
    <div className="container mx-auto py-10 px-0 md:px-6 h-full">
      <Card className="h-full shadow-2xl flex flex-col">
        <CardHeader className="text-center border-b flex-shrink-0">
           <CardTitle className="text-3xl font-headline tracking-tight">
             Niouspark Smart AI
           </CardTitle>
           <CardDescription className="mt-2 text-lg text-muted-foreground">
             Your personal assistant for anything you need.
           </CardDescription>
         </CardHeader>
         <CardContent className="p-0 flex-1 min-h-0">
            <ChatClient />
         </CardContent>
      </Card>
    </div>
  );
}
