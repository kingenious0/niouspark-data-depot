import fs from 'fs';
import path from 'path';

export interface WEPWritingPattern {
  sentenceLengths: number[];
  transitionPhrases: string[];
  personalPronouns: string[];
  contractions: string[];
  informalConnectors: string[];
  emotionalMarkers: string[];
  naturalImperfections: string[];
  voiceShifts: string[];
  repetitionPatterns: string[];
}

export interface WEPEssay {
  id: string;
  content: string;
  topic: string;
  level: string;
  country: string;
  patterns: WEPWritingPattern;
}

export interface WEPDatasetStats {
  totalEssays: number;
  averageSentenceLength: number;
  mostCommonTransitions: string[];
  mostCommonContractions: string[];
  naturalImperfections: string[];
  emotionalResonance: number;
  personalTouch: number;
}

export class WEPDatasetAnalyzer {
  private datasetPath: string;
  private patterns: WEPWritingPattern[] = [];

  constructor(datasetPath: string = 'docs/WEP_2_Classified_Merged') {
    this.datasetPath = datasetPath;
  }

  async analyzeDataset(): Promise<WEPDatasetStats> {
    try {
      const files = await this.getWEPFiles();
      const essays: WEPEssay[] = [];

      for (const file of files) {
        const essay = await this.analyzeEssay(file);
        if (essay) {
          essays.push(essay);
          this.patterns.push(essay.patterns);
        }
      }

      return this.generateDatasetStats(essays);
    } catch (error) {
      console.error('Error analyzing WEP dataset:', error);
      throw error;
    }
  }

  private async getWEPFiles(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.datasetPath);
      return files
        .filter(file => file.endsWith('.txt'))
        .map(file => path.join(this.datasetPath, file));
    } catch (error) {
      console.error('Error reading WEP dataset directory:', error);
      return [];
    }
  }

  private async analyzeEssay(filePath: string): Promise<WEPEssay | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const filename = path.basename(filePath, '.txt');
      const metadata = this.parseFilename(filename);
      const patterns = this.extractWritingPatterns(content);
      
      return {
        id: filename,
        content,
        topic: metadata.topic,
        level: metadata.level,
        country: metadata.country,
        patterns
      };
    } catch (error) {
      console.error(`Error analyzing essay ${filePath}:`, error);
      return null;
    }
  }

  private parseFilename(filename: string): { country: string; topic: string; level: string } {
    const parts = filename.split('_');
    
    if (parts.length >= 4) {
      return {
        country: parts[1] || 'UNKNOWN',
        topic: parts[2] || 'UNKNOWN',
        level: parts[3] || 'UNKNOWN'
      };
    }
    
    return { country: 'UNKNOWN', topic: 'UNKNOWN', level: 'UNKNOWN' };
  }

  private extractWritingPatterns(content: string): WEPWritingPattern {
    const sentences = this.splitIntoSentences(content);
    
    return {
      sentenceLengths: sentences.map(s => s.split(' ').length),
      transitionPhrases: this.extractTransitionPhrases(content),
      personalPronouns: this.extractPersonalPronouns(content),
      contractions: this.extractContractions(content),
      informalConnectors: this.extractInformalConnectors(content),
      emotionalMarkers: this.extractEmotionalMarkers(content),
      naturalImperfections: this.extractNaturalImperfections(content),
      voiceShifts: this.extractVoiceShifts(content),
      repetitionPatterns: this.extractRepetitionPatterns(content)
    };
  }

  private splitIntoSentences(content: string): string[] {
    return content
      .replace(/([.!?])\s+/g, '$1|')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private extractTransitionPhrases(content: string): string[] {
    const transitions = [
      'first', 'second', 'third', 'finally', 'in conclusion',
      'on the other hand', 'however', 'nevertheless', 'meanwhile',
      'additionally', 'furthermore', 'moreover', 'besides',
      'for example', 'for instance', 'such as', 'like',
      'in my opinion', 'from my perspective', 'personally',
      'it is clear that', 'obviously', 'undoubtedly',
      'to begin with', 'to start with', 'firstly', 'secondly'
    ];

    return transitions.filter(transition => 
      content.toLowerCase().includes(transition.toLowerCase())
    );
  }

  private extractPersonalPronouns(content: string): string[] {
    const pronouns = ['i', 'me', 'my', 'myself', 'you', 'your', 'yours', 'yourself'];
    return pronouns.filter(pronoun => 
      content.toLowerCase().includes(pronoun.toLowerCase())
    );
  }

  private extractContractions(content: string): string[] {
    const contractions = [
      "don't", "can't", "won't", "isn't", "aren't", "wasn't", "weren't",
      "hasn't", "haven't", "hadn't", "doesn't", "didn't", "wouldn't",
      "couldn't", "shouldn't", "mightn't", "mustn't", "shan't",
      "it's", "that's", "there's", "here's", "he's", "she's",
      "i'm", "you're", "we're", "they're", "i've", "you've",
      "we've", "they've", "i'd", "you'd", "he'd", "she'd",
      "we'd", "they'd", "i'll", "you'll", "he'll", "she'll",
      "we'll", "they'll"
    ];

    return contractions.filter(contraction => 
      content.toLowerCase().includes(contraction.toLowerCase())
    );
  }

  private extractInformalConnectors(content: string): string[] {
    const connectors = [
      'well', 'actually', 'basically', 'literally', 'honestly',
      'you know', 'i mean', 'sort of', 'kind of', 'like',
      'right', 'okay', 'so', 'anyway', 'anyhow'
    ];

    return connectors.filter(connector => 
      content.toLowerCase().includes(connector.toLowerCase())
    );
  }

  private extractEmotionalMarkers(content: string): string[] {
    const emotions = [
      'love', 'hate', 'like', 'dislike', 'enjoy', 'appreciate',
      'fear', 'worry', 'concern', 'hope', 'wish', 'believe',
      'think', 'feel', 'know', 'understand', 'agree', 'disagree',
      'support', 'oppose', 'favor', 'prefer', 'suggest', 'recommend'
    ];

    return emotions.filter(emotion => 
      content.toLowerCase().includes(emotion.toLowerCase())
    );
  }

  private extractNaturalImperfections(content: string): string[] {
    const imperfections = [
      'um', 'uh', 'er', 'ah', 'oh', 'hmm', 'well',
      'you see', 'i guess', 'i suppose', 'maybe', 'perhaps',
      'sort of', 'kind of', 'a bit', 'a little', 'quite',
      'rather', 'pretty', 'very', 'really', 'actually'
    ];

    return imperfections.filter(imperfection => 
      content.toLowerCase().includes(imperfection.toLowerCase())
    );
  }

  private extractVoiceShifts(content: string): string[] {
    const hasPersonal = content.toLowerCase().includes('i ') || content.toLowerCase().includes('my ');
    const hasFormal = content.toLowerCase().includes('therefore') || content.toLowerCase().includes('furthermore');
    
    if (hasPersonal && hasFormal) {
      return ['personal to formal'];
    }
    
    return [];
  }

  private extractRepetitionPatterns(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const wordCount: { [key: string]: number } = {};
    
    words.forEach(word => {
      if (word.length > 3) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    return Object.entries(wordCount)
      .filter(([_, count]) => count > 2)
      .map(([word, _]) => word)
      .slice(0, 10);
  }

  private generateDatasetStats(essays: WEPEssay[]): WEPDatasetStats {
    const allSentenceLengths = essays.flatMap(e => e.patterns.sentenceLengths);
    const allTransitions = essays.flatMap(e => e.patterns.transitionPhrases);
    const allContractions = essays.flatMap(e => e.patterns.contractions);
    const allImperfections = essays.flatMap(e => e.patterns.naturalImperfections);

    const transitionCounts = this.countOccurrences(allTransitions);
    const contractionCounts = this.countOccurrences(allContractions);
    const imperfectionCounts = this.countOccurrences(allImperfections);

    return {
      totalEssays: essays.length,
      averageSentenceLength: allSentenceLengths.reduce((a, b) => a + b, 0) / allSentenceLengths.length,
      mostCommonTransitions: this.getTopItems(transitionCounts, 10),
      mostCommonContractions: this.getTopItems(contractionCounts, 10),
      naturalImperfections: this.getTopItems(imperfectionCounts, 10),
      emotionalResonance: this.calculateEmotionalResonance(essays),
      personalTouch: this.calculatePersonalTouch(essays)
    };
  }

  private countOccurrences(items: string[]): { [key: string]: number } {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private getTopItems(counts: { [key: string]: number }, limit: number): string[] {
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([item, _]) => item);
  }

  private calculateEmotionalResonance(essays: WEPEssay[]): number {
    const totalEmotionalMarkers = essays.reduce((sum, essay) => 
      sum + essay.patterns.emotionalMarkers.length, 0
    );
    return Math.min(totalEmotionalMarkers / essays.length / 5, 1);
  }

  private calculatePersonalTouch(essays: WEPEssay[]): number {
    const totalPersonalElements = essays.reduce((sum, essay) => 
      sum + essay.patterns.personalPronouns.length + essay.patterns.contractions.length, 0
    );
    return Math.min(totalPersonalElements / essays.length / 10, 1);
  }

  getRandomHumanPatterns(count: number = 3): WEPWritingPattern[] {
    const shuffled = [...this.patterns].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  exportHumanPatterns(): {
    sentenceLengths: number[];
    transitions: string[];
    contractions: string[];
    informalConnectors: string[];
    emotionalMarkers: string[];
    naturalImperfections: string[];
  } {
    const allLengths = this.patterns.flatMap(p => p.sentenceLengths);
    const allTransitions = [...new Set(this.patterns.flatMap(p => p.transitionPhrases))];
    const allContractions = [...new Set(this.patterns.flatMap(p => p.contractions))];
    const allConnectors = [...new Set(this.patterns.flatMap(p => p.informalConnectors))];
    const allEmotions = [...new Set(this.patterns.flatMap(p => p.emotionalMarkers))];
    const allImperfections = [...new Set(this.patterns.flatMap(p => p.naturalImperfections))];

    return {
      sentenceLengths: allLengths,
      transitions: allTransitions,
      contractions: allContractions,
      informalConnectors: allConnectors,
      emotionalMarkers: allEmotions,
      naturalImperfections: allImperfections
    };
  }
}
