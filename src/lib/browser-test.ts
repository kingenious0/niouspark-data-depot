/**
 * Browser Compatibility Test Suite
 * Tests for Voice Chat and Puter AI features
 */

export interface BrowserTestResult {
  browser: string;
  version?: string;
  speechRecognition: {
    supported: boolean;
    api?: string;
    limitations?: string[];
  };
  speechSynthesis: {
    supported: boolean;
    voices: number;
    limitations?: string[];
  };
  puterAI: {
    canLoad: boolean;
    error?: string;
  };
  webAPIs: {
    fetch: boolean;
    localStorage: boolean;
    clipboard: boolean;
  };
  overall: 'excellent' | 'good' | 'limited' | 'poor';
  recommendations?: string[];
}

export class BrowserCompatibilityTester {
  async runFullTest(): Promise<BrowserTestResult> {
    const browser = this.detectBrowser();
    const speechRecognition = this.testSpeechRecognition();
    const speechSynthesis = this.testSpeechSynthesis();
    const puterAI = await this.testPuterAI();
    const webAPIs = this.testWebAPIs();
    
    const overall = this.calculateOverallScore(speechRecognition, speechSynthesis, puterAI, webAPIs);
    const recommendations = this.generateRecommendations(speechRecognition, speechSynthesis, puterAI);

    return {
      browser: browser.name,
      version: browser.version,
      speechRecognition,
      speechSynthesis,
      puterAI,
      webAPIs,
      overall,
      recommendations
    };
  }

  private detectBrowser(): { name: string; version?: string } {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      return { name: 'Chrome', version: match ? match[1] : undefined };
    } else if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/);
      return { name: 'Firefox', version: match ? match[1] : undefined };
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/(\d+)/);
      return { name: 'Safari', version: match ? match[1] : undefined };
    } else if (userAgent.includes('Edge')) {
      const match = userAgent.match(/Edg\/(\d+)/);
      return { name: 'Edge', version: match ? match[1] : undefined };
    }
    
    return { name: 'Unknown' };
  }

  private testSpeechRecognition(): BrowserTestResult['speechRecognition'] {
    const limitations: string[] = [];
    let api = '';
    
    if ('SpeechRecognition' in window) {
      api = 'SpeechRecognition';
    } else if ('webkitSpeechRecognition' in window) {
      api = 'webkitSpeechRecognition';
      limitations.push('Uses webkit prefix (Chrome/Safari specific)');
    } else {
      return {
        supported: false,
        limitations: ['Speech recognition not supported in this browser']
      };
    }

    // Test for common limitations
    const browser = this.detectBrowser();
    if (browser.name === 'Firefox') {
      limitations.push('Limited support in Firefox');
    } else if (browser.name === 'Safari') {
      limitations.push('Requires user interaction to work');
      limitations.push('May not work in private browsing');
    }

    return {
      supported: true,
      api,
      limitations: limitations.length > 0 ? limitations : undefined
    };
  }

  private testSpeechSynthesis(): BrowserTestResult['speechSynthesis'] {
    if (!('speechSynthesis' in window)) {
      return {
        supported: false,
        voices: 0,
        limitations: ['Speech synthesis not supported in this browser']
      };
    }

    const voices = speechSynthesis.getVoices();
    const limitations: string[] = [];
    
    if (voices.length === 0) {
      limitations.push('No voices available (may load asynchronously)');
    }

    const browser = this.detectBrowser();
    if (browser.name === 'Chrome') {
      limitations.push('May require user interaction before speaking');
    }

    return {
      supported: true,
      voices: voices.length,
      limitations: limitations.length > 0 ? limitations : undefined
    };
  }

  private async testPuterAI(): Promise<BrowserTestResult['puterAI']> {
    try {
      // Test if we can load Puter.js
      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({
            canLoad: false,
            error: 'Timeout loading Puter.js'
          });
        }, 5000);

        script.onload = () => {
          clearTimeout(timeout);
          resolve({ canLoad: true });
        };

        script.onerror = () => {
          clearTimeout(timeout);
          resolve({
            canLoad: false,
            error: 'Failed to load Puter.js'
          });
        };

        document.head.appendChild(script);
      });
    } catch (error) {
      return {
        canLoad: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private testWebAPIs(): BrowserTestResult['webAPIs'] {
    return {
      fetch: 'fetch' in window,
      localStorage: 'localStorage' in window,
      clipboard: 'navigator' in window && 'clipboard' in navigator
    };
  }

  private calculateOverallScore(
    speechRecognition: BrowserTestResult['speechRecognition'],
    speechSynthesis: BrowserTestResult['speechSynthesis'],
    puterAI: BrowserTestResult['puterAI'],
    webAPIs: BrowserTestResult['webAPIs']
  ): BrowserTestResult['overall'] {
    let score = 0;
    
    // Speech Recognition (30%)
    if (speechRecognition.supported) {
      score += speechRecognition.limitations ? 15 : 30;
    }
    
    // Speech Synthesis (20%)
    if (speechSynthesis.supported) {
      score += speechSynthesis.limitations ? 10 : 20;
    }
    
    // Puter AI (25%)
    if (puterAI.canLoad) {
      score += 25;
    }
    
    // Web APIs (25%)
    const apiScore = Object.values(webAPIs).filter(Boolean).length;
    score += (apiScore / 3) * 25;
    
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'limited';
    return 'poor';
  }

  private generateRecommendations(
    speechRecognition: BrowserTestResult['speechRecognition'],
    speechSynthesis: BrowserTestResult['speechSynthesis'],
    puterAI: BrowserTestResult['puterAI']
  ): string[] {
    const recommendations: string[] = [];
    
    if (!speechRecognition.supported) {
      recommendations.push('For voice input, use Chrome, Edge, or Safari');
    } else if (speechRecognition.limitations?.length) {
      recommendations.push('Voice input may have limitations in this browser');
    }
    
    if (!speechSynthesis.supported) {
      recommendations.push('For voice output, upgrade to a modern browser');
    }
    
    if (!puterAI.canLoad) {
      recommendations.push('Puter AI enhancement requires internet connection');
    }
    
    const browser = this.detectBrowser();
    if (browser.name === 'Firefox') {
      recommendations.push('For best voice experience, consider using Chrome or Edge');
    } else if (browser.name === 'Safari') {
      recommendations.push('Voice features may require user interaction in Safari');
    }
    
    return recommendations;
  }
}

// Quick test function for debugging
export async function quickBrowserTest(): Promise<void> {
  const tester = new BrowserCompatibilityTester();
  const result = await tester.runFullTest();
  
  console.group('🧪 Browser Compatibility Test Results');
  console.log('Browser:', result.browser, result.version || '');
  console.log('Overall Score:', result.overall);
  
  console.group('Voice Features');
  console.log('Speech Recognition:', result.speechRecognition.supported ? '✅' : '❌');
  console.log('Speech Synthesis:', result.speechSynthesis.supported ? '✅' : '❌');
  if (result.speechSynthesis.supported) {
    console.log('Available Voices:', result.speechSynthesis.voices);
  }
  console.groupEnd();
  
  console.group('AI Features');
  console.log('Puter AI:', result.puterAI.canLoad ? '✅' : '❌');
  if (result.puterAI.error) {
    console.warn('Puter AI Error:', result.puterAI.error);
  }
  console.groupEnd();
  
  console.group('Web APIs');
  console.log('Fetch API:', result.webAPIs.fetch ? '✅' : '❌');
  console.log('LocalStorage:', result.webAPIs.localStorage ? '✅' : '❌');
  console.log('Clipboard API:', result.webAPIs.clipboard ? '✅' : '❌');
  console.groupEnd();
  
  if (result.recommendations?.length) {
    console.group('Recommendations');
    result.recommendations.forEach(rec => console.log('💡', rec));
    console.groupEnd();
  }
  
  console.groupEnd();
}
