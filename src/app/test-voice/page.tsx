'use client';

import { useState } from 'react';
import { VoiceChat } from '@/components/chat/voice-chat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function TestVoicePage() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  const handleTranscript = (text: string) => {
    setTranscript(text);
    toast({
      title: "Voice Input Received! 🎤",
      description: text
    });
  };

  const handleStartListening = () => {
    setIsListening(true);
    toast({
      title: "🎤 Listening Started",
      description: "Speak now!"
    });
  };

  const handleStopListening = () => {
    setIsListening(false);
    toast({
      title: "🛑 Listening Stopped",
      description: "Voice input complete"
    });
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎤 Voice Chat Test Page
            <Badge variant="outline">Testing</Badge>
          </CardTitle>
          <CardDescription>
            Test the voice-to-voice chat functionality to ensure it's working properly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Chat Component */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-4">Voice Chat Controls</h3>
            <VoiceChat
              onTranscript={handleTranscript}
              onStartListening={handleStartListening}
              onStopListening={handleStopListening}
              isDisabled={false}
            />
          </div>

          {/* Status Display */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={isListening ? "default" : "secondary"}>
                Status: {isListening ? "🎤 Listening" : "⏸️ Ready"}
              </Badge>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Latest Transcript:
                </h4>
                <p className="text-blue-900 dark:text-blue-100">
                  "{transcript}"
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/20 border rounded-lg">
              <h4 className="font-medium mb-2">Test Instructions:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Start Voice Input" to begin listening</li>
                <li>Speak clearly into your microphone</li>
                <li>Watch for the live transcription</li>
                <li>Check if the text appears in the transcript box</li>
                <li>Test the speaker icon for text-to-speech</li>
              </ol>
            </div>

            {/* Browser Compatibility */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Browser Support:
              </h4>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>✅ <strong>Chrome/Edge:</strong> Full support (STT + TTS)</li>
                <li>⚠️ <strong>Safari:</strong> TTS works, STT limited</li>
                <li>⚠️ <strong>Firefox:</strong> TTS works, no STT</li>
                <li>📱 <strong>Mobile:</strong> Varies by browser</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
