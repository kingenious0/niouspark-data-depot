'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Monitor, 
  Mic, 
  Volume2, 
  Bot,
  Wifi,
  Clipboard,
  HardDrive
} from 'lucide-react';
import { BrowserCompatibilityTester, type BrowserTestResult } from '@/lib/browser-test';
import { cn } from '@/lib/utils';

export function BrowserTestPanel() {
  const [testResult, setTestResult] = useState<BrowserTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tester = new BrowserCompatibilityTester();
      const result = await tester.runFullTest();
      setTestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run test on mount
    runTest();
  }, []);

  const getOverallColor = (overall: BrowserTestResult['overall']) => {
    switch (overall) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'limited': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const StatusIcon = ({ supported }: { supported: boolean }) => (
    supported ? 
      <CheckCircle className="h-5 w-5 text-green-600" /> : 
      <XCircle className="h-5 w-5 text-red-600" />
  );

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Browser Test Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={runTest} className="mt-4">
            Retry Test
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Browser Compatibility Test
        </CardTitle>
        <CardDescription>
          Testing browser support for Niouspark voice and AI features
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent animate-spin rounded-full mx-auto" />
              <p className="text-muted-foreground">Running compatibility tests...</p>
            </div>
          </div>
        ) : testResult ? (
          <>
            {/* Overall Score */}
            <div className={cn(
              "p-4 rounded-lg border",
              getOverallColor(testResult.overall)
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {testResult.browser} {testResult.version}
                  </h3>
                  <p className="text-sm opacity-90">
                    Overall Compatibility: <span className="font-medium capitalize">{testResult.overall}</span>
                  </p>
                </div>
                <Badge variant="outline" className="text-inherit border-current">
                  {testResult.overall.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Feature Tests */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Voice Features */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Voice Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Speech Recognition</span>
                    <StatusIcon supported={testResult.speechRecognition.supported} />
                  </div>
                  {testResult.speechRecognition.api && (
                    <div className="text-xs text-muted-foreground">
                      API: {testResult.speechRecognition.api}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Speech Synthesis</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {testResult.speechSynthesis.voices} voices
                      </span>
                      <StatusIcon supported={testResult.speechSynthesis.supported} />
                    </div>
                  </div>
                  
                  {(testResult.speechRecognition.limitations || testResult.speechSynthesis.limitations) && (
                    <div className="mt-2 space-y-1">
                      {testResult.speechRecognition.limitations?.map((limitation, i) => (
                        <div key={i} className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {limitation}
                        </div>
                      ))}
                      {testResult.speechSynthesis.limitations?.map((limitation, i) => (
                        <div key={i} className="text-xs text-amber-600 flex items-center gap-1">
                          <Volume2 className="h-3 w-3" />
                          {limitation}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI & Web APIs */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI & Web APIs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Puter AI</span>
                    <StatusIcon supported={testResult.puterAI.canLoad} />
                  </div>
                  {testResult.puterAI.error && (
                    <div className="text-xs text-red-600">
                      Error: {testResult.puterAI.error}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-1">
                      <Wifi className="h-3 w-3" />
                      Fetch API
                    </span>
                    <StatusIcon supported={testResult.webAPIs.fetch} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      Local Storage
                    </span>
                    <StatusIcon supported={testResult.webAPIs.localStorage} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-1">
                      <Clipboard className="h-3 w-3" />
                      Clipboard API
                    </span>
                    <StatusIcon supported={testResult.webAPIs.clipboard} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            {testResult.recommendations && testResult.recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {testResult.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Test Actions */}
            <div className="flex gap-2">
              <Button onClick={runTest} variant="outline">
                Re-run Test
              </Button>
              <Button 
                onClick={() => {
                  console.log('Browser Test Result:', testResult);
                  alert('Test result logged to console');
                }} 
                variant="ghost"
              >
                Export Results
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Button onClick={runTest}>
              Run Compatibility Test
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
