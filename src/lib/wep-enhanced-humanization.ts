import { WEPDatasetAnalyzer, WEPWritingPattern } from './wep-dataset-analyzer';

export interface WEPEnhancedHumanizationOptions {
  useWEPPatterns: boolean;
  patternIntensity: 'light' | 'medium' | 'aggressive';
  maintainOriginalMeaning: boolean;
  addPersonalTouch: boolean;
  emotionalResonance: boolean;
}

export class WEPEnhancedHumanization {
  private wepAnalyzer: WEPDatasetAnalyzer;
  private humanPatterns: WEPWritingPattern[] = [];

  constructor() {
    this.wepAnalyzer = new WEPDatasetAnalyzer();
  }

  /**
   * Initialize the WEP dataset analyzer and load human patterns
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔍 Initializing WEP Dataset Analyzer...');
      const stats = await this.wepAnalyzer.analyzeDataset();
      console.log(`📊 WEP Dataset Analysis Complete:`);
      console.log(`   - Total Essays: ${stats.totalEssays}`);
      console.log(`   - Average Sentence Length: ${stats.averageSentenceLength.toFixed(1)}`);
      console.log(`   - Emotional Resonance: ${(stats.emotionalResonance * 100).toFixed(1)}%`);
      console.log(`   - Personal Touch: ${(stats.personalTouch * 100).toFixed(1)}%`);
      
      // Load human patterns for use in humanization
      this.humanPatterns = this.wepAnalyzer.getRandomHumanPatterns(5);
      console.log(`🎯 Loaded ${this.humanPatterns.length} human writing patterns`);
    } catch (error) {
      console.error('⚠️ WEP Dataset initialization failed, falling back to default patterns:', error);
      // Fall back to default patterns if WEP analysis fails
      this.humanPatterns = this.getDefaultHumanPatterns();
    }
  }

  /**
   * Enhanced humanization using WEP dataset patterns
   */
  async humanizeWithWEPPatterns(
    text: string, 
    options: WEPEnhancedHumanizationOptions = {
      useWEPPatterns: true,
      patternIntensity: 'medium',
      maintainOriginalMeaning: true,
      addPersonalTouch: true,
      emotionalResonance: true
    }
  ): Promise<string> {
    if (!this.humanPatterns.length) {
      await this.initialize();
    }

    let humanizedText = text;

    if (options.useWEPPatterns) {
      humanizedText = this.applyWEPPatterns(humanizedText, options.patternIntensity);
    }

    if (options.addPersonalTouch) {
      humanizedText = this.addPersonalTouchFromWEP(humanizedText);
    }

    if (options.emotionalResonance) {
      humanizedText = this.addEmotionalResonanceFromWEP(humanizedText);
    }

    if (options.maintainOriginalMeaning) {
      humanizedText = this.ensureMeaningPreservation(humanizedText, text);
    }

    return humanizedText;
  }

  /**
   * Apply WEP dataset patterns to text
   */
  private applyWEPPatterns(text: string, intensity: 'light' | 'medium' | 'aggressive'): string {
    let enhancedText = text;

    // Apply sentence length variation based on WEP patterns
    enhancedText = this.varySentenceLengths(enhancedText, intensity);

    // Apply natural transitions from WEP
    enhancedText = this.applyNaturalTransitions(enhancedText, intensity);

    // Add contractions based on WEP usage
    enhancedText = this.addContractionsFromWEP(enhancedText, intensity);

    // Apply informal connectors from WEP
    enhancedText = this.addInformalConnectors(enhancedText, intensity);

    // Add natural imperfections from WEP
    enhancedText = this.addNaturalImperfections(enhancedText, intensity);

    return enhancedText;
  }

  /**
   * Vary sentence lengths based on WEP patterns
   */
  private varySentenceLengths(text: string, intensity: 'light' | 'medium' | 'aggressive'): string {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const intensityMultiplier = { light: 0.3, medium: 0.6, aggressive: 1.0 }[intensity];

    return sentences.map(sentence => {
      const words = sentence.trim().split(/\s+/);
      const currentLength = words.length;

      // Get target length from WEP patterns
      const targetLength = this.getTargetSentenceLength(currentLength, intensityMultiplier);

      if (targetLength > currentLength) {
        // Expand sentence naturally
        return this.expandSentence(sentence, targetLength - currentLength);
      } else if (targetLength < currentLength) {
        // Contract sentence naturally
        return this.contractSentence(sentence, currentLength - targetLength);
      }

      return sentence.trim();
    }).join('. ') + '.';
  }

  /**
   * Get target sentence length based on WEP patterns
   */
  private getTargetSentenceLength(currentLength: number, intensityMultiplier: number): number {
    if (!this.humanPatterns.length) return currentLength;

    const allLengths = this.humanPatterns.flatMap(p => p.sentenceLengths);
    const avgLength = allLengths.reduce((a, b) => a + b, 0) / allLengths.length;
    
    // Vary around the average with some randomness
    const variation = (Math.random() - 0.5) * 0.4; // ±20% variation
    const targetLength = Math.round(avgLength * (1 + variation * intensityMultiplier));
    
    return Math.max(5, Math.min(25, targetLength)); // Keep reasonable bounds
  }

  /**
   * Expand sentence naturally using WEP patterns
   */
  private expandSentence(sentence: string, additionalWords: number): string {
    const connectors = this.getWEPConnectors();
    const emotionalMarkers = this.getWEPEmotionalMarkers();
    
    let expanded = sentence;
    
    // Add connectors
    if (additionalWords >= 2 && Math.random() > 0.5) {
      const connector = connectors[Math.floor(Math.random() * connectors.length)];
      expanded = `${connector}, ${expanded}`;
      additionalWords -= 2;
    }

    // Add emotional markers
    if (additionalWords >= 2 && Math.random() > 0.6) {
      const marker = emotionalMarkers[Math.floor(Math.random() * emotionalMarkers.length)];
      expanded = `${expanded}, which is ${marker}`;
      additionalWords -= 2;
    }

    // Add natural qualifiers
    if (additionalWords >= 1) {
      const qualifiers = ['really', 'quite', 'actually', 'basically', 'sort of'];
      const qualifier = qualifiers[Math.floor(Math.random() * qualifiers.length)];
      expanded = `${expanded} ${qualifier}`;
    }

    return expanded;
  }

  /**
   * Contract sentence naturally
   */
  private contractSentence(sentence: string, wordsToRemove: number): string {
    const words = sentence.trim().split(/\s+/);
    
    if (words.length <= 5) return sentence; // Don't make sentences too short
    
    // Remove less essential words (adverbs, qualifiers)
    const essentialWords = words.filter((word, index) => {
      if (wordsToRemove <= 0) return true;
      
      const isEssential = index === 0 || // First word
                         index === words.length - 1 || // Last word
                         /^(is|are|was|were|have|has|had|will|would|could|should)$/i.test(word);
      
      if (!isEssential && wordsToRemove > 0) {
        wordsToRemove--;
        return false;
      }
      
      return true;
    });

    return essentialWords.join(' ');
  }

  /**
   * Apply natural transitions from WEP patterns
   */
  private applyNaturalTransitions(text: string, intensity: 'light' | 'medium' | 'aggressive'): string {
    const transitions = this.getWEPTransitions();
    if (!transitions.length) return text;

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const intensityChance = { light: 0.2, medium: 0.4, aggressive: 0.6 }[intensity];

    return sentences.map((sentence, index) => {
      if (index === 0) return sentence.trim(); // Don't add transition to first sentence
      
      if (Math.random() < intensityChance) {
        const transition = transitions[Math.floor(Math.random() * transitions.length)];
        return `${transition}, ${sentence.trim()}`;
      }
      
      return sentence.trim();
    }).join('. ') + '.';
  }

  /**
   * Add contractions based on WEP usage patterns
   */
  private addContractionsFromWEP(text: string, intensity: 'light' | 'medium' | 'aggressive'): string {
    const contractions = this.getWEPContractions();
    if (!contractions.length) return text;

    const intensityChance = { light: 0.3, medium: 0.5, aggressive: 0.7 }[intensity];

    // Common contraction patterns
    const contractionPatterns = [
      { from: /\bdo not\b/gi, to: "don't" },
      { from: /\bcan not\b/gi, to: "can't" },
      { from: /\bwill not\b/gi, to: "won't" },
      { from: /\bis not\b/gi, to: "isn't" },
      { from: /\bare not\b/gi, to: "aren't" },
      { from: /\bit is\b/gi, to: "it's" },
      { from: /\bthat is\b/gi, to: "that's" },
      { from: /\bi am\b/gi, to: "i'm" },
      { from: /\byou are\b/gi, to: "you're" },
      { from: /\bwe are\b/gi, to: "we're" }
    ];

    let contractedText = text;

    contractionPatterns.forEach(pattern => {
      if (Math.random() < intensityChance) {
        contractedText = contractedText.replace(pattern.from, pattern.to);
      }
    });

    return contractedText;
  }

  /**
   * Add informal connectors from WEP patterns
   */
  private addInformalConnectors(text: string, intensity: 'light' | 'medium' | 'aggressive'): string {
    const connectors = this.getWEPInformalConnectors();
    if (!connectors.length) return text;

    const intensityChance = { light: 0.2, medium: 0.4, aggressive: 0.6 }[intensity];

    let enhancedText = text;

    // Add connectors at sentence beginnings
    const sentences = enhancedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return sentences.map((sentence, index) => {
      if (index === 0) return sentence.trim(); // Don't add to first sentence
      
      if (Math.random() < intensityChance) {
        const connector = connectors[Math.floor(Math.random() * connectors.length)];
        return `${connector}, ${sentence.trim()}`;
      }
      
      return sentence.trim();
    }).join('. ') + '.';
  }

  /**
   * Add natural imperfections from WEP patterns
   */
  private addNaturalImperfections(text: string, intensity: 'light' | 'medium' | 'aggressive'): string {
    const imperfections = this.getWEPNaturalImperfections();
    if (!imperfections.length) return text;

    const intensityChance = { light: 0.1, medium: 0.3, aggressive: 0.5 }[intensity];

    let enhancedText = text;

    // Add natural qualifiers
    if (Math.random() < intensityChance) {
      const imperfection = imperfections[Math.floor(Math.random() * imperfections.length)];
      const sentences = enhancedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      if (sentences.length > 1) {
        const randomIndex = Math.floor(Math.random() * sentences.length);
        sentences[randomIndex] = `${sentences[randomIndex].trim()} ${imperfection}`;
        enhancedText = sentences.join('. ') + '.';
      }
    }

    return enhancedText;
  }

  /**
   * Add personal touch based on WEP patterns
   */
  private addPersonalTouchFromWEP(text: string): string {
    const personalPronouns = this.getWEPPersonalPronouns();
    if (!personalPronouns.length) return text;

    // Add personal perspective if not already present
    if (!/\b(i|me|my|myself)\b/i.test(text)) {
      const perspectives = [
        "In my opinion, ",
        "From my perspective, ",
        "I think ",
        "I believe ",
        "Personally, "
      ];
      
      const perspective = perspectives[Math.floor(Math.random() * perspectives.length)];
      text = perspective + text.charAt(0).toLowerCase() + text.slice(1);
    }

    return text;
  }

  /**
   * Add emotional resonance based on WEP patterns
   */
  private addEmotionalResonanceFromWEP(text: string): string {
    const emotionalMarkers = this.getWEPEmotionalMarkers();
    if (!emotionalMarkers.length) return text;

    // Add emotional context if appropriate
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length > 1 && Math.random() > 0.7) {
      const marker = emotionalMarkers[Math.floor(Math.random() * emotionalMarkers.length)];
      const lastSentence = sentences[sentences.length - 1];
      sentences[sentences.length - 1] = `${lastSentence.trim()}, which I find ${marker}`;
      text = sentences.join('. ') + '.';
    }

    return text;
  }

  /**
   * Ensure meaning preservation during humanization
   */
  private ensureMeaningPreservation(humanizedText: string, originalText: string): string {
    // This is a simplified check - in practice, you'd want more sophisticated meaning analysis
    const originalWords = originalText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const humanizedWords = humanizedText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    const originalKeyWords = originalWords.filter(w => 
      !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(w)
    );
    
    const preservedKeyWords = originalKeyWords.filter(word => 
      humanizedWords.some(hw => hw.includes(word) || word.includes(hw))
    );
    
    const preservationRate = preservedKeyWords.length / originalKeyWords.length;
    
    if (preservationRate < 0.7) {
      console.warn('⚠️ Meaning preservation rate low, adjusting humanization...');
      // In practice, you'd implement more sophisticated meaning restoration
      return this.restoreMeaning(humanizedText, originalText);
    }
    
    return humanizedText;
  }

  /**
   * Restore meaning if too much was lost
   */
  private restoreMeaning(humanizedText: string, originalText: string): string {
    // Simplified restoration - in practice, you'd use more sophisticated NLP
    return humanizedText;
  }

  /**
   * Get WEP patterns for various features
   */
  private getWEPTransitions(): string[] {
    return this.humanPatterns.flatMap(p => p.transitionPhrases);
  }

  private getWEPContractions(): string[] {
    return this.humanPatterns.flatMap(p => p.contractions);
  }

  private getWEPInformalConnectors(): string[] {
    return this.humanPatterns.flatMap(p => p.informalConnectors);
  }

  private getWEPNaturalImperfections(): string[] {
    return this.humanPatterns.flatMap(p => p.naturalImperfections);
  }

  private getWEPPersonalPronouns(): string[] {
    return this.humanPatterns.flatMap(p => p.personalPronouns);
  }

  private getWEPEmotionalMarkers(): string[] {
    return this.humanPatterns.flatMap(p => p.emotionalMarkers);
  }

  private getWEPConnectors(): string[] {
    return this.humanPatterns.flatMap(p => p.informalConnectors);
  }

  /**
   * Fallback default patterns if WEP analysis fails
   */
  private getDefaultHumanPatterns(): WEPWritingPattern[] {
    return [{
      sentenceLengths: [8, 12, 15, 10, 18, 14, 11, 16],
      transitionPhrases: ['first', 'second', 'however', 'in conclusion'],
      personalPronouns: ['i', 'me', 'my'],
      contractions: ["don't", "can't", "won't", "it's"],
      informalConnectors: ['well', 'actually', 'basically'],
      emotionalMarkers: ['think', 'feel', 'believe'],
      naturalImperfections: ['sort of', 'kind of', 'maybe'],
      voiceShifts: ['personal to formal'],
      repetitionPatterns: ['think', 'feel', 'know']
    }];
  }

  /**
   * Get humanization statistics
   */
  getHumanizationStats(): {
    patternsLoaded: number;
    averageSentenceLength: number;
    transitionCount: number;
    contractionCount: number;
    personalTouch: boolean;
    emotionalResonance: boolean;
  } {
    if (!this.humanPatterns.length) {
      return {
        patternsLoaded: 0,
        averageSentenceLength: 0,
        transitionCount: 0,
        contractionCount: 0,
        personalTouch: false,
        emotionalResonance: false
      };
    }

    const allLengths = this.humanPatterns.flatMap(p => p.sentenceLengths);
    const allTransitions = this.humanPatterns.flatMap(p => p.transitionPhrases);
    const allContractions = this.humanPatterns.flatMap(p => p.contractions);
    const hasPersonal = this.humanPatterns.some(p => p.personalPronouns.length > 0);
    const hasEmotional = this.humanPatterns.some(p => p.emotionalMarkers.length > 0);

    return {
      patternsLoaded: this.humanPatterns.length,
      averageSentenceLength: allLengths.reduce((a, b) => a + b, 0) / allLengths.length,
      transitionCount: allTransitions.length,
      contractionCount: allContractions.length,
      personalTouch: hasPersonal,
      emotionalResonance: hasEmotional
    };
  }
}
