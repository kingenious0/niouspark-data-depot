// src/app/admin/ai/page.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminChatClient } from "./components/admin-chat-client";
import { PredictionClient } from "./components/prediction-client";
import { MessageSquare, LineChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminAIPage() {
  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 h-full">
      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-bold">AI Suite</h1>
          <p className="text-muted-foreground mb-4">
            Your integrated artificial intelligence toolkit.
          </p>
          <TabsList className="grid w-full max-w-lg grid-cols-2">
            <TabsTrigger value="chat">
              <MessageSquare className="mr-2 h-4 w-4" />
              Business Analyst Chat
            </TabsTrigger>
            <TabsTrigger value="predict">
              <LineChart className="mr-2 h-4 w-4" />
              Sales Analyst
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="chat" className="flex-1 flex flex-col mt-4">
          <Card className="flex-grow flex flex-col overflow-hidden">
             <CardContent className="p-0 flex-1 h-full">
                <AdminChatClient />
             </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="predict" className="flex-1 flex flex-col mt-4">
          <div className="flex-grow overflow-auto">
             <PredictionClient />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}