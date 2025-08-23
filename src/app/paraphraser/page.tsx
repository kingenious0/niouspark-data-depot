"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  FileText,
  Upload,
  Wand2,
  Copy,
  Download,
  Loader2,
  RotateCcw,
  AlertCircle,
  BarChart3,
  FileDown,
  FileText as FileTextIcon,
  FileImage
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { auth } from "@/lib/firebase";
import { WORD_LIMIT, type Mode, type Tone } from "@/lib/constants";

export default function ParaphraserPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [mode, setMode] = useState<Mode>('paraphrase');
  const [tone, setTone] = useState<Tone>('casual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [humanLikenessAnalysis, setHumanLikenessAnalysis] = useState<any>(null);
  const [exportFormat, setExportFormat] = useState<'txt' | 'pdf' | 'docx'>('txt');
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Count words in real-time
  const countWords = useCallback((text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  const handleInputChange = (text: string) => {
    setInputText(text);
    setWordCount(countWords(text));
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.txt', '.pdf', '.docx'];
    const fileName = file.name.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.some(ext => fileName.endsWith(ext))) {
      toast({
        title: "Unsupported File Type",
        description: "Please use TXT, PDF, or DOCX files only.",
        variant: "destructive"
      });
      return;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSelectedFile(file);
      
      // For TXT files, extract text immediately on client side
      if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
        const text = await file.text();
        setInputText(text);
        setWordCount(countWords(text));
        
        toast({
          title: "File Loaded",
          description: `Successfully loaded ${file.name} (${countWords(text)} words)`
        });
      } else {
        // For PDF/DOCX files, we'll extract text on the server when processing
        toast({
          title: "File Selected",
          description: `${file.name} selected. Text will be extracted when you process the file.`
        });
      }
    } catch (error) {
      toast({
        title: "File Load Error",
        description: "Failed to read the file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleParaphrase = async () => {
    // Check if we have a file that needs server-side processing
    const needsFileProcessing = selectedFile && !inputText.trim() && 
      (selectedFile.name.toLowerCase().endsWith('.pdf') || selectedFile.name.toLowerCase().endsWith('.docx'));

    if (!inputText.trim() && !needsFileProcessing) {
      toast({
        title: "No Text",
        description: "Please enter some text or select a file to paraphrase.",
        variant: "destructive"
      });
      return;
    }

    if (inputText.trim() && wordCount > WORD_LIMIT) {
      toast({
        title: "Text Too Long",
        description: `Please limit your text to ${WORD_LIMIT} words. Current: ${wordCount} words.`,
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setOutputText("");

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Authentication required. Please log in.");
      }

      let response;
      
      // Handle file upload (PDF/DOCX)
      if (needsFileProcessing) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('tone', tone);
        formData.append('mode', mode);

        response = await fetch('/api/paraphrase', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${idToken}`
          },
          body: formData
        });
      } else {
        // Handle text input
        response = await fetch('/api/paraphrase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            text: inputText,
            mode,
            tone
          })
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to paraphrase text');
      }

      if (result.success && result.paraphrasedText) {
        setOutputText(result.paraphrasedText);

        // Set human-likeness analysis if available
        if (result.humanLikenessAnalysis) {
          setHumanLikenessAnalysis(result.humanLikenessAnalysis);
        }

        // If we processed a file, update the input text with extracted content
        if (needsFileProcessing) {
          setInputText(result.originalText);
          setWordCount(countWords(result.originalText));
        }

        const analysisText = result.humanLikenessAnalysis
          ? ` (Human-likeness: ${(result.humanLikenessAnalysis.score * 100).toFixed(1)}%)`
          : '';

        toast({
          title: "Success!",
          description: needsFileProcessing
            ? `File processed and paraphrased successfully (${result.wordCount} words)${analysisText}`
            : `Text paraphrased successfully (${result.wordCount} words processed)${analysisText}`
        });
      } else {
        throw new Error(result.error || 'No paraphrased text received');
      }

    } catch (error: any) {
      console.error('Paraphrasing error:', error);
      toast({
        title: "Paraphrasing Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!outputText) return;
    
    try {
      await navigator.clipboard.writeText(outputText);
      toast({
        title: "Copied!",
        description: "Paraphrased text copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy text. Please select and copy manually.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async () => {
    if (!outputText) return;
    
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Authentication required. Please log in.");
      }

      // Call export API
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          text: outputText,
          format: exportFormat,
          filename: `humanized_text_${new Date().toISOString().split('T')[0]}`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get the file blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `humanized_text_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Exported Successfully!",
        description: `Text exported as ${exportFormat.toUpperCase()} file.`
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setInputText("");
    setOutputText("");
    setWordCount(0);
    setSelectedFile(null);
    setHumanLikenessAnalysis(null);
    setExportFormat('txt');
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to use the paraphraser.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mb-4">
          <p className="text-lg text-muted-foreground mb-2">
            Hello, <span className="font-semibold text-foreground">{user.displayName || user.email?.split('@')[0] || 'User'}</span>! 👋
          </p>
          <h1 className="text-4xl font-bold font-headline tracking-tight">
            AI Text Paraphraser & Humanizer
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Transform your text with AI-powered paraphrasing. Make content more natural, avoid plagiarism, and improve readability.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Input Text
            </CardTitle>
            <CardDescription>
              Enter your text or upload a file (TXT, PDF, DOCX supported)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload File (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                {selectedFile && (
                  <Badge variant="secondary">
                    {selectedFile.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Text Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="input-text">Text to Paraphrase</Label>
                <Badge variant={wordCount > WORD_LIMIT ? "destructive" : "secondary"}>
                  {wordCount} / {WORD_LIMIT} words
                </Badge>
              </div>
              <Textarea
                id="input-text"
                placeholder="Paste your text here or upload a file above..."
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                className="min-h-[300px] resize-none"
              />
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={mode} onValueChange={(value: Mode) => setMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paraphrase">Paraphrase</SelectItem>
                    <SelectItem value="humanize">Humanize</SelectItem>
                    <SelectItem value="ultra-humanize">Ultra Humanize Pro</SelectItem>
                    <SelectItem value="wep-humanize">🎯 WEP-Enhanced Humanize</SelectItem>
                    <SelectItem value="simplify">Simplify</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={(value: Tone) => setTone(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleParaphrase} 
                disabled={isProcessing || (!inputText.trim() && !selectedFile) || (inputText.trim() && wordCount > WORD_LIMIT) || false}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {mode === 'paraphrase' ? 'Paraphrase' : 
                     mode === 'humanize' ? 'Humanize' : 
                     mode === 'ultra-humanize' ? 'Ultra Humanize Pro' : 
                     mode === 'wep-humanize' ? '🎯 WEP-Enhanced Humanize' : 'Simplify'}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={isProcessing}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {wordCount > WORD_LIMIT && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Text exceeds the {WORD_LIMIT} word limit. Please reduce the length.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Paraphrased Result
            </CardTitle>
            <CardDescription>
              Your transformed text will appear here
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="output-text">Paraphrased Text</Label>
              <Textarea
                id="output-text"
                placeholder="Your paraphrased text will appear here..."
                value={outputText}
                readOnly
                className="min-h-[300px] resize-none bg-muted/50"
              />
            </div>

            {/* Export Format Selection */}
            {outputText && (
              <div className="space-y-2">
                <Label>Export Format</Label>
                <div className="flex gap-2">
                  <Button
                    variant={exportFormat === 'txt' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExportFormat('txt')}
                    className="flex-1"
                  >
                    <FileTextIcon className="mr-2 h-3 w-3" />
                    TXT
                  </Button>
                  <Button
                    variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExportFormat('pdf')}
                    className="flex-1"
                  >
                    <FileImage className="mr-2 h-3 w-3" />
                    PDF
                  </Button>
                  <Button
                    variant={exportFormat === 'docx' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExportFormat('docx')}
                    className="flex-1"
                  >
                    <FileDown className="mr-2 h-3 w-3" />
                    DOCX
                  </Button>
                </div>
              </div>
            )}

            {/* Output Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleCopy}
                disabled={!outputText}
                className="flex-1"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDownload}
                disabled={!outputText}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download {exportFormat.toUpperCase()}
              </Button>
            </div>

            {outputText && (
              <div className="space-y-2 pt-2">
                <div className="text-sm text-muted-foreground text-center">
                  Output: {countWords(outputText)} words
                </div>

                {/* Human-likeness Analysis */}
                {humanLikenessAnalysis && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                        Enhanced Human-likeness Analysis
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">Overall Score</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {(humanLikenessAnalysis.score * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {humanLikenessAnalysis.score > 0.7 ? 'High human-likeness' :
                           humanLikenessAnalysis.score > 0.5 ? 'Moderate human-likeness' :
                           'Low human-likeness'}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">Key Factors</div>
                        <div className="text-xs space-y-1">
                          <div>Sentence Variation: {(humanLikenessAnalysis.factors.sentenceVariation * 100).toFixed(1)}%</div>
                          <div>Contractions: {(humanLikenessAnalysis.factors.contractionUsage * 100).toFixed(1)}%</div>
                          <div>Conversational: {(humanLikenessAnalysis.factors.conversationalElements * 100).toFixed(1)}%</div>
                          <div>Natural Flow: {(humanLikenessAnalysis.factors.naturalFlow * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Metrics */}
                    {humanLikenessAnalysis.factors.perplexity && (
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                        <div className="font-medium text-blue-700 dark:text-blue-300 mb-2">Research-Based Metrics</div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="text-blue-600 dark:text-blue-400">Perplexity (Unpredictability)</div>
                            <div className="font-semibold">{(humanLikenessAnalysis.factors.perplexity * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-blue-600 dark:text-blue-400">Burstiness (Variation)</div>
                            <div className="font-semibold">{(humanLikenessAnalysis.factors.burstiness * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-blue-600 dark:text-blue-400">Readability (Flesch)</div>
                            <div className="font-semibold">{(humanLikenessAnalysis.factors.readability * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-blue-600 dark:text-blue-400">Jargon-Free</div>
                            <div className="font-semibold">{(humanLikenessAnalysis.factors.jargonFree * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Detection Insights */}
                    {humanLikenessAnalysis.insights && (
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                        <div className="font-medium text-blue-700 dark:text-blue-300 mb-2">AI Detection Insights</div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="text-blue-600 dark:text-blue-400">AI Jargon Found</div>
                            <div className="font-semibold">{humanLikenessAnalysis.insights.aiJargonCount}</div>
                          </div>
                          <div>
                            <div className="text-blue-600 dark:text-blue-400">Passive Voice</div>
                            <div className="font-semibold">{humanLikenessAnalysis.insights.passiveVoiceCount}</div>
                          </div>
                          <div>
                            <div className="text-blue-600 dark:text-blue-400">Emotional Resonance</div>
                            <div className="font-semibold">{(humanLikenessAnalysis.insights.emotionalResonance * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-blue-600 dark:text-blue-400">Personal Touch</div>
                            <div className="font-semibold">{(humanLikenessAnalysis.insights.personalTouch * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Features Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>🚀 Enhanced Humaniser Pro Features</CardTitle>
          <CardDescription>
            Advanced AI detector resistance with maximum human-like output
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">🔄 Paraphrase</h4>
              <p className="text-muted-foreground">
                Rewrite text using different words and structures while maintaining the original meaning.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🛡️ Humanize</h4>
              <p className="text-muted-foreground">
                <strong>AI Detector Resistant:</strong> Transform text with sophisticated human patterns, emotional markers, and natural imperfections.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🚀 Ultra Humanize Pro</h4>
              <p className="text-muted-foreground">
                <strong>Maximum AI Detector Resistance:</strong> Deep text cleaning + ultra-aggressive humanization with speech patterns, interruptions, and personal anecdotes for complete undetectability.
              </p>
              <ul className="mt-2 text-xs text-muted-foreground list-disc list-inside">
                <li>Deep text cleaning (emojis, markdown, HTML)</li>
                <li>Ultra-human speech patterns & interruptions</li>
                <li>Personal anecdotes & natural restarts</li>
                <li>Maximum detector bypass technology</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📝 Simplify</h4>
              <p className="text-muted-foreground">
                Make complex text clearer and easier to understand while preserving all key information.
              </p>
            </div>
          </div>

          {/* AI Detector Resistance Features */}
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-semibold mb-3 text-green-800 dark:text-green-200">
              🛡️ Research-Based AI Detector Resistance
            </h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-green-700 dark:text-green-300 mb-2">Perplexity & Burstiness</h5>
                <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                  <li>• High perplexity (unpredictability)</li>
                  <li>• Variable sentence lengths</li>
                  <li>• Natural burstiness patterns</li>
                  <li>• Research-proven human markers</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-green-700 dark:text-green-300 mb-2">Jargon Removal & Readability</h5>
                <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                  <li>• Remove AI-favored words</li>
                  <li>• Optimize Flesch scores (60-70)</li>
                  <li>• Replace business jargon</li>
                  <li>• Natural language alternatives</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-green-700 dark:text-green-300 mb-2">Emotional & Personal Touch</h5>
                <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                  <li>• Sensory details & feelings</li>
                  <li>• Personal anecdotes & stories</li>
                  <li>• Real-life examples</li>
                  <li>• Emotional resonance markers</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 p-2 bg-green-100 dark:bg-green-800/30 rounded text-xs text-green-700 dark:text-green-300">
              <strong>Research-Based Success:</strong> Built on proven AI text detection research including perplexity, burstiness, Flesch scores, and jargon removal for maximum detector bypass.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
