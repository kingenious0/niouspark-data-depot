'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, TrendingUp, MessageSquare, BarChart3, Brain, Sparkles } from 'lucide-react';
import { AdminChatClient } from './components/admin-chat-client';
import { PredictionClient } from './components/prediction-client';

export default function AdminAIPage() {
  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 h-full">
      <div className="flex flex-col space-y-6 h-full">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-headline">AI Suite</h1>
            <p className="text-muted-foreground">Advanced AI-powered business analytics and insights</p>
          </div>
        </div>

        {/* AI Suite Tabs */}
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Business Analyst
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Sales Analysis
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="flex-1 mt-6">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Smart Business Analyst</CardTitle>
                    <CardDescription>
                      Ask questions about sales, revenue, customers, and business performance. 
                      Get instant insights from your real-time data.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <AdminChatClient />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="predictions" className="flex-1 mt-6">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">AI Sales Insights</CardTitle>
                    <CardDescription>
                      Generate comprehensive sales analysis reports powered by AI. 
                      Compare performance across different time periods.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PredictionClient />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Feature highlight */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <span>Powered by Gemini 2.0 Flash - Real-time data analysis and insights</span>
        </div>
      </div>
    </div>
  );
}
