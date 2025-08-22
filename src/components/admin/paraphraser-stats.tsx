"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wand2, FileText, Users, TrendingUp } from "lucide-react";
import { auth } from "@/lib/firebase";

interface ParaphraseUsage {
  id: string;
  userId: string;
  wordCount: number;
  mode: string;
  tone: string;
  timestamp: string;
  userName?: string;
  email?: string;
}

interface ParaphraseStats {
  totalUsage: number;
  totalWords: number;
  uniqueUsers: number;
  averageWordsPerRequest: number;
  modeBreakdown: { [key: string]: number };
  toneBreakdown: { [key: string]: number };
  recentUsage: ParaphraseUsage[];
}

export default function ParaphraserStats() {
  const [stats, setStats] = useState<ParaphraseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParaphraseStats();
  }, []);

  const fetchParaphraseStats = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const response = await fetch('/api/admin/paraphraser-stats', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch paraphraser stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Paraphraser Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Paraphraser Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No paraphraser usage data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{stats.totalUsage}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Words Processed</p>
                <p className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Unique Users</p>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Avg. Words/Request</p>
                <p className="text-2xl font-bold">{Math.round(stats.averageWordsPerRequest)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mode Usage</CardTitle>
            <CardDescription>How users are using the paraphraser</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.modeBreakdown).map(([mode, count]) => (
                <div key={mode} className="flex items-center justify-between">
                  <span className="capitalize">{mode}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tone Preferences</CardTitle>
            <CardDescription>Popular tone selections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.toneBreakdown).map(([tone, count]) => (
                <div key={tone} className="flex items-center justify-between">
                  <span className="capitalize">{tone}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest paraphraser usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentUsage.slice(0, 5).map((usage) => (
              <div key={usage.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{usage.userName || 'Anonymous'}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {usage.mode}
                    </Badge>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {usage.tone}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {usage.email} • {usage.wordCount} words
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(usage.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
