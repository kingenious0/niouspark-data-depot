import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { validateEnvironment } from "@/lib/env-config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Settings } from "lucide-react";
import { SimpleGeminiChat } from "./simple-gemini-chat";
import { ErrorBoundary } from "@/components/error-boundary";

export default function ServerChatPage() {
  // Server-side environment validation
  const envValidation = validateEnvironment();
  
  // If environment is not properly configured, show configuration message
  if (!envValidation.isValid) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">AI Chat - Configuration Required</CardTitle>
            <CardDescription className="text-lg">
              The AI chat service needs to be configured before it can be used.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Missing Configuration</AlertTitle>
              <AlertDescription>
                The following environment variables need to be configured:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {envValidation.missing.map((key) => (
                    <li key={key} className="font-mono text-sm">{key}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="text-center text-muted-foreground">
              <p>Please contact your system administrator to configure these services.</p>
              <p className="mt-2">In the meantime, you can explore other features of Niouspark:</p>
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              <a 
                href="/bundles" 
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Browse Data Bundles
              </a>
              <a 
                href="/" 
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Go Home
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Environment is properly configured, show the chat interface
  return (
    <div className="h-full">
      <ErrorBoundary>
        <SimpleGeminiChat />
      </ErrorBoundary>
    </div>
  );
}
