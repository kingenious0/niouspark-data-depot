import { HUMAN_CONNECTORS, HUMANIZATION_PERSONAS, type HumanizationPersona } from './constants';

/**
 * Post-processing humanization module to make AI-generated text more human-like
 * and resistant to AI detectors by introducing natural imperfections and variations
 *
 * Enhanced with advanced AI detector resistance techniques for maximum undetectability
 */

/**
 * Advanced human writing patterns for maximum AI detector resistance
 */
const ADVANCED_HUMAN_PATTERNS = {
  sentenceVariability: {
    short: ['So,', 'But', 'Yet', 'Then', 'Now', 'Well,'],
    medium: ['You see,', 'Actually,', 'Honestly,', 'Basically,'],
    long: ['On the other hand,', 'At the end of the day,', 'In my opinion,', 'From what I can tell,']
  },
  imperfections: {
    hesitations: ['uh', 'um', 'like', 'you know', 'I mean', 'well'],
    selfCorrections: ['wait, no', 'actually', 'or rather', 'let me rephrase that'],
    fillers: ['sort of', 'kind of', 'pretty much', 'more or less']
  },
  emotionalMarkers: {
    emphasis: ['really', 'truly', 'actually', 'seriously', 'literally'],
    uncertainty: ['I think', 'I believe', 'probably', 'maybe', 'perhaps'],
    engagement: ['you know', 'right?', 'isn\'t it?', 'don\'t you think?']
  },
  naturalTransitions: {
    contrast: ['however', 'but', 'yet', 'although', 'on the other hand'],
    addition: ['also', 'plus', 'moreover', 'furthermore', 'in addition'],
    example: ['for instance', 'for example', 'like', 'such as', 'say'],
    conclusion: ['so', 'therefore', 'thus', 'in conclusion', 'ultimately']
  }
};

/**
 * AI-detector resistant word substitutions
 * Replace common AI-preferred terms with more human alternatives
 */
const AI_DETECTOR_SUBSTITUTIONS = {
  // Replace overly formal/academic terms
  'utilize': ['use', 'make use of', 'take advantage of'],
  'implement': ['put in place', 'set up', 'get going with'],
  'facilitate': ['help', 'make easier', 'support'],
  'optimize': ['improve', 'make better', 'tweak'],
  'leverage': ['use', 'take advantage of', 'make the most of'],
  'synergize': ['work together', 'team up', 'collaborate'],
  'paradigm': ['approach', 'way of thinking', 'model'],
  'methodology': ['method', 'approach', 'way of doing things'],
  'comprehensive': ['thorough', 'complete', 'detailed'],
  'substantial': ['significant', 'good amount of', 'quite a bit of'],
  'notable': ['worth mentioning', 'interesting', 'important'],
  'endeavor': ['effort', 'attempt', 'project'],

  // Replace robotic sounding phrases
  'it is important to note': ['you should know', 'keep in mind', 'remember'],
  'in conclusion': ['so', 'anyway', 'well', 'to wrap this up'],
  'furthermore': ['plus', 'also', 'on top of that', 'what\'s more'],
  'however': ['but', 'though', 'that said', 'mind you'],
  'therefore': ['so', 'that means', 'because of that', 'as a result'],
  'additionally': ['also', 'plus', 'another thing', 'oh, and'],

  // Replace overly precise language
  'approximately': ['about', 'around', 'roughly', 'give or take'],
  'specifically': ['particularly', 'especially', 'mainly'],
  'precisely': ['exactly', 'just so', 'spot on'],
  'essentially': ['basically', 'really', 'at its core'],
  'literally': ['really', 'actually', 'honestly']
};

interface HumanizationOptions {
  persona?: HumanizationPersona;
  intensity?: 'light' | 'medium' | 'aggressive';
}

/**
 * Adds natural human variations to text structure and flow
 */
export function humanizeText(text: string, options: HumanizationOptions = {}): string {
  const { persona = 'student', intensity = 'medium' } = options;
  
  let processedText = text;
  
  // Step 1: Add conversational connectors
  processedText = addConversationalConnectors(processedText, intensity);
  
  // Step 2: Vary sentence structure and length
  processedText = varysentenceStructure(processedText, intensity);
  
  // Step 3: Add contractions for natural flow
  processedText = addContractions(processedText);
  
  // Step 4: Add persona-specific modifications
  processedText = applyPersonaModifications(processedText, persona, intensity);
  
  // Step 5: Introduce subtle imperfections
  processedText = addSubtleImperfections(processedText, intensity);
  
  return processedText.trim();
}

/**
 * Adds conversational connectors at natural points in the text
 */
function addConversationalConnectors(text: string, intensity: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const connectorFrequency = intensity === 'light' ? 0.15 : intensity === 'medium' ? 0.25 : 0.35;
  
  return sentences.map((sentence, index) => {
    // Don't modify the first sentence or add connectors too frequently
    if (index === 0 || Math.random() > connectorFrequency || sentences.length < 3) {
      return sentence;
    }
    
    const connector = HUMAN_CONNECTORS[Math.floor(Math.random() * HUMAN_CONNECTORS.length)];
    return `${connector} ${sentence.toLowerCase()}`;
  }).join(' ');
}

/**
 * Varies sentence structure to break AI patterns
 */
function varysentenceStructure(text: string, intensity: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  return sentences.map((sentence, index) => {
    // Occasionally create sentence fragments or combine sentences
    if (intensity === 'aggressive' && Math.random() < 0.2 && sentences.length > 3) {
      if (sentence.length > 100 && sentence.includes(',')) {
        // Break long sentences into fragments
        const parts = sentence.split(',');
        const midpoint = Math.floor(parts.length / 2);
        return parts.slice(0, midpoint).join(',') + '. ' + 
               parts.slice(midpoint).join(',').replace(/^[a-z]/, c => c.toUpperCase());
      }
    }
    
    return sentence;
  }).join(' ');
}

/**
 * Adds natural contractions to make text more conversational
 */
function addContractions(text: string): string {
  const contractions: Record<string, string> = {
    'do not': "don't",
    'does not': "doesn't",
    'did not': "didn't",
    'will not': "won't",
    'would not': "wouldn't",
    'could not': "couldn't",
    'should not': "shouldn't",
    'cannot': "can't",
    'is not': "isn't",
    'are not': "aren't",
    'was not': "wasn't",
    'were not': "weren't",
    'have not': "haven't",
    'has not': "hasn't",
    'had not': "hadn't",
    'it is': "it's",
    'that is': "that's",
    'there is': "there's",
    'what is': "what's",
    'where is': "where's",
    'you are': "you're",
    'we are': "we're",
    'they are': "they're",
    'I am': "I'm",
    'you have': "you've",
    'we have': "we've",
    'they have': "they've",
    'I have': "I've",
  };
  
  let result = text;
  
  Object.entries(contractions).forEach(([full, contracted]) => {
    // Use contractions about 60% of the time to maintain natural variation
    if (Math.random() < 0.6) {
      const regex = new RegExp('\\b' + full.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
      result = result.replace(regex, contracted);
    }
  });
  
  return result;
}

/**
 * Applies persona-specific writing modifications
 */
function applyPersonaModifications(text: string, persona: HumanizationPersona, intensity: string): string {
  let result = text;
  
  switch (persona) {
    case 'student':
      // Add casual expressions and slight informality
      if (intensity !== 'light') {
        result = result.replace(/However,/gi, Math.random() < 0.5 ? 'But,' : 'Though,');
        result = result.replace(/Therefore,/gi, Math.random() < 0.5 ? 'So,' : "That's why");
        result = result.replace(/Furthermore,/gi, Math.random() < 0.5 ? 'Also,' : 'Plus,');
      }
      break;
      
    case 'blogger':
      // Add engaging, personal touches
      const personalTouches = [
        "Here's the thing:",
        'Let me tell you,',
        'You might be wondering',
        "I've found that",
        "What I've noticed is"
      ];
      if (Math.random() < 0.3 && intensity !== 'light') {
        const randomTouch = personalTouches[Math.floor(Math.random() * personalTouches.length)];
        result = result.replace(/^([A-Z])/, `${randomTouch} $1`.toLowerCase());
      }
      break;
      
    case 'journalist':
      // Add direct, no-nonsense modifications
      result = result.replace(/It is important to note that/gi, 'Worth noting:');
      result = result.replace(/It should be mentioned that/gi, 'Key point:');
      break;
      
    case 'professional':
      // Maintain professionalism but add subtle human touches
      if (intensity === 'aggressive') {
        result = result.replace(/It is evident that/gi, 'Clearly,');
        result = result.replace(/In conclusion,/gi, 'To wrap up,');
      }
      break;
  }
  
  return result;
}

/**
 * Adds subtle imperfections that humans naturally include
 */
function addSubtleImperfections(text: string, intensity: string): string {
  if (intensity === 'light') return text;
  
  let result = text;
  
  // Occasionally add redundant words or phrases (humans do this naturally)
  if (Math.random() < 0.15 && intensity === 'aggressive') {
    const redundancies = [
      { original: 'very important', replacement: 'really very important' },
      { original: 'significant', replacement: 'quite significant' },
      { original: 'effective', replacement: 'pretty effective' },
      { original: 'useful', replacement: 'really useful' }
    ];
    
    redundancies.forEach(({ original, replacement }) => {
      if (Math.random() < 0.3) {
        const regex = new RegExp('\\b' + original + '\\b', 'gi');
        result = result.replace(regex, replacement);
      }
    });
  }
  
  // Add occasional hesitation markers
  if (Math.random() < 0.1 && intensity !== 'light') {
    const hesitations = [', well,', ', I mean,', ', you see,'];
    const randomHesitation = hesitations[Math.floor(Math.random() * hesitations.length)];
    
    // Find a good place to insert hesitation (after commas)
    const commaPositions = [...result.matchAll(/,\s/g)];
    if (commaPositions.length > 0) {
      const randomPosition = commaPositions[Math.floor(Math.random() * commaPositions.length)];
      if (randomPosition.index !== undefined) {
        result = result.slice(0, randomPosition.index + 1) + randomHesitation + ' ' + 
                result.slice(randomPosition.index + 2);
      }
    }
  }
  
  return result;
}

/**
 * Apply AI-detector resistant word substitutions
 */
function applyDetectorSubstitutions(text: string): string {
  let modifiedText = text;

  // Apply substitutions randomly (30-70% chance per occurrence)
  Object.entries(AI_DETECTOR_SUBSTITUTIONS).forEach(([original, alternatives]) => {
    const regex = new RegExp(`\\b${original}\\b`, 'gi');
    modifiedText = modifiedText.replace(regex, (match) => {
      if (Math.random() < 0.5) { // 50% chance to substitute
        return alternatives[Math.floor(Math.random() * alternatives.length)];
      }
      return match;
    });
  });

  return modifiedText;
}

/**
 * Add natural sentence variability to break AI patterns
 */
function addSentenceVariability(text: string): string {
  const patterns = ADVANCED_HUMAN_PATTERNS.sentenceVariability;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  const modifiedSentences = sentences.map(sentence => {
    const trimmed = sentence.trim();

    // Add natural starters to some sentences
    if (Math.random() < 0.2) { // 20% chance
      const wordCount = trimmed.split(/\s+/).length;
      let starter;

      if (wordCount <= 5) {
        starter = patterns.short[Math.floor(Math.random() * patterns.short.length)];
      } else if (wordCount <= 15) {
        starter = patterns.medium[Math.floor(Math.random() * patterns.medium.length)];
      } else {
        starter = patterns.long[Math.floor(Math.random() * patterns.long.length)];
      }

      return `${starter} ${trimmed}`;
    }

    return trimmed;
  });

  return modifiedSentences.join('. ').trim() + '.';
}

/**
 * Add emotional markers and engagement cues
 */
function addEmotionalMarkers(text: string): string {
  const patterns = ADVANCED_HUMAN_PATTERNS.emotionalMarkers;
  let modifiedText = text;

  // Add emphasis markers (5-10% chance per sentence)
  const sentences = modifiedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const modifiedSentences = sentences.map(sentence => {
    if (Math.random() < 0.07) {
      const emphasis = patterns.emphasis[Math.floor(Math.random() * patterns.emphasis.length)];
      return `${emphasis} ${sentence.trim()}`;
    }
    return sentence.trim();
  });

  modifiedText = modifiedSentences.join('. ') + '.';

  // Add uncertainty markers occasionally
  if (Math.random() < 0.15) {
    const uncertainty = patterns.uncertainty[Math.floor(Math.random() * patterns.uncertainty.length)];
    const words = modifiedText.split(' ');
    const insertPos = Math.floor(Math.random() * (words.length - 5)) + 5;
    words.splice(insertPos, 0, uncertainty);
    modifiedText = words.join(' ');
  }

  // Add engagement cues at the end of paragraphs
  if (Math.random() < 0.1) {
    const engagement = patterns.engagement[Math.floor(Math.random() * patterns.engagement.length)];
    modifiedText = `${modifiedText.trim()} ${engagement}`;
  }

  return modifiedText;
}

/**
 * Apply natural transitions instead of formal connectors
 */
function humanizeTransitions(text: string): string {
  const patterns = ADVANCED_HUMAN_PATTERNS.naturalTransitions;
  let modifiedText = text;

  // Replace formal transitions with natural alternatives
  Object.entries(patterns).forEach(([category, alternatives]) => {
    // This is a simplified approach - in production, you'd want more sophisticated pattern matching
    const categoryWords = {
      contrast: ['however', 'nevertheless', 'nonetheless'],
      addition: ['furthermore', 'moreover', 'additionally'],
      example: ['for example', 'for instance', 'specifically'],
      conclusion: ['therefore', 'thus', 'consequently', 'in conclusion']
    };

    categoryWords[category as keyof typeof categoryWords]?.forEach(formalWord => {
      const regex = new RegExp(`\\b${formalWord}\\b`, 'gi');
      modifiedText = modifiedText.replace(regex, (match) => {
        if (Math.random() < 0.6) { // 60% chance to substitute
          return alternatives[Math.floor(Math.random() * alternatives.length)];
        }
        return match;
      });
    });
  });

  return modifiedText;
}

/**
 * Enhanced humanization with maximum AI detector resistance
 */
export function advancedHumanizeText(text: string, options: HumanizationOptions = {}): string {
  const { persona = 'blogger', intensity = 'medium' } = options;

  let processedText = text;

  // Apply advanced humanization techniques
  if (intensity !== 'light') {
    processedText = applyDetectorSubstitutions(processedText);
    processedText = addSentenceVariability(processedText);
    processedText = addEmotionalMarkers(processedText);
    processedText = humanizeTransitions(processedText);
  }

  // Apply existing humanization pipeline
  processedText = humanizeText(processedText, options);

  // Add persona-specific advanced touches
  processedText = applyAdvancedPersonaModifications(processedText, persona, intensity);

  return processedText.trim();
}

/**
 * Apply advanced persona-specific modifications
 */
function applyAdvancedPersonaModifications(text: string, persona: HumanizationPersona, intensity: string): string {
  let result = text;

  switch (persona) {
    case 'student':
      // Add more casual, youthful expressions
      if (intensity === 'aggressive') {
        const studentExpressions = [
          'like, seriously',
          'I mean, come on',
          'you get what I\'m saying',
          'it\'s kinda weird',
          'super interesting'
        ];
        if (Math.random() < 0.25) {
          const expression = studentExpressions[Math.floor(Math.random() * studentExpressions.length)];
          result = result.replace(/^([A-Z])/, `${expression}, $1`.toLowerCase());
        }
      }
      break;

    case 'blogger':
      // Add more personal, engaging touches
      if (intensity !== 'light') {
        const bloggerTouches = [
          'Here\'s what I\'ve learned:',
          'Trust me on this:',
          'The thing is,',
          'What really matters is',
          'Let me break this down for you:'
        ];
        if (Math.random() < 0.3) {
          const touch = bloggerTouches[Math.floor(Math.random() * bloggerTouches.length)];
          result = result.replace(/^([A-Z])/, `${touch} $1`.toLowerCase());
        }
      }
      break;

    case 'professional':
      // Maintain professionalism but add subtle human touches
      if (intensity === 'aggressive') {
        result = result.replace(/It is my recommendation/gi, 'I\'d recommend');
        result = result.replace(/It is advisable to/gi, 'You should');
        result = result.replace(/One should consider/gi, 'Consider');
      }
      break;
  }

  return result;
}

/**
 * Advanced text cleaning and preprocessing for maximum humanization
 * Removes AI artifacts, emojis, markdown, and formatting that could trigger detectors
 */
export function deepCleanText(rawText: string): string {
  let cleaned = rawText;

  // Remove emojis and special Unicode characters
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F6FF}]/gu, ''); // emojis
  cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // supplemental symbols
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, ''); // miscellaneous symbols
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, ''); // dingbats

  // Remove markdown and formatting
  cleaned = cleaned.replace(/[#*_`>~-]/g, ''); // markdown symbols
  cleaned = cleaned.replace(/<[^>]*>/g, ''); // HTML tags
  cleaned = cleaned.replace(/```[\s\S]*?```/g, ''); // code blocks
  cleaned = cleaned.replace(/`[^`]*`/g, ''); // inline code
  cleaned = cleaned.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // markdown links

  // Remove excessive whitespace and normalize
  cleaned = cleaned.replace(/\s{2,}/g, ' '); // multiple spaces
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // excessive newlines
  cleaned = cleaned.replace(/\t/g, ' '); // tabs to spaces

  // Remove common AI artifacts
  cleaned = cleaned.replace(/\b(Note:|Important:|Key point:|Remember:|Tip:)/gi, '');
  cleaned = cleaned.replace(/\b(Here's what you need to know:|Let me explain:|To summarize:)/gi, '');
  cleaned = cleaned.replace(/\b(As you can see:|Clearly:|Obviously:|Evidently:)/gi, '');

  // Remove numbered lists and bullet points
  cleaned = cleaned.replace(/^\d+\.\s*/gm, ''); // numbered lists
  cleaned = cleaned.replace(/^[-*•]\s*/gm, ''); // bullet points

  return cleaned.trim();
}

/**
 * Enhanced AI jargon removal based on research insights
 * Replaces AI-favored words with natural alternatives for better humanization
 */
export function removeAIJargon(text: string): string {
  let result = text;

  // Business jargon replacements
  const jargonMap: Record<string, string[]> = {
    'leverage': ['use', 'take advantage of', 'make the most of'],
    'facilitate': ['help', 'make easier', 'support'],
    'strategic initiative': ['project', 'plan', 'goal'],
    'stakeholders': ['people involved', 'team members', 'everyone affected'],
    'methodology': ['method', 'approach', 'way of doing things'],
    'optimize': ['improve', 'make better', 'enhance'],
    'proprietary': ['special', 'unique', 'our own'],
    'ROI': ['return on investment', 'results', 'benefits'],
    'customer acquisition': ['getting customers', 'finding clients', 'building your audience'],
    'aforementioned': ['mentioned above', 'what I said before', 'this'],
    'necessitates': ['needs', 'requires', 'calls for'],
    'utilize': ['use', 'take advantage of', 'work with'],
    'furthermore': ['plus', 'also', 'what\'s more'],
    'however': ['but', 'though', 'on the other hand'],
    'therefore': ['so', 'that means', 'as a result'],
    'subsequently': ['then', 'after that', 'next'],
    'consequently': ['so', 'because of this', 'as a result'],
    'nevertheless': ['still', 'even so', 'but'],
    'moreover': ['plus', 'also', 'what\'s more'],
    'thus': ['so', 'this means', 'therefore']
  };

  // Replace jargon with natural alternatives
  Object.entries(jargonMap).forEach(([jargon, alternatives]) => {
    const regex = new RegExp(`\\b${jargon}\\b`, 'gi');
    result = result.replace(regex, () => {
      return alternatives[Math.floor(Math.random() * alternatives.length)];
    });
  });

  // Remove passive voice constructions
  result = result.replace(/\b(is|are|was|were)\s+(being\s+)?(done|performed|conducted|executed|implemented)\b/gi, 
    (match, verb, being, action) => {
      const activeAlternatives = ['doing', 'performing', 'conducting', 'executing', 'implementing'];
      return activeAlternatives[Math.floor(Math.random() * activeAlternatives.length)];
    }
  );

  return result;
}

/**
 * Calculate Flesch Reading Ease score (0-100, higher = easier to read)
 * Target range: 60-70 for optimal humanization
 */
export function calculateFleschScore(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = countSyllables(text);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease formula
  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Count syllables in text (approximate)
 */
function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let syllableCount = 0;

  words.forEach(word => {
    // Remove non-alphabetic characters
    const cleanWord = word.replace(/[^a-z]/g, '');
    
    if (cleanWord.length <= 3) {
      syllableCount += 1;
    } else {
      // Count vowel groups (approximate syllable count)
      const vowelGroups = cleanWord.match(/[aeiouy]+/g) || [];
      syllableCount += vowelGroups.length;
      
      // Adjust for silent 'e' at end
      if (cleanWord.endsWith('e') && cleanWord.length > 3) {
        syllableCount -= 1;
      }
      
      // Ensure minimum of 1 syllable
      syllableCount = Math.max(1, syllableCount);
    }
  });

  return syllableCount;
}

/**
 * Optimize text for target Flesch score (60-70 range)
 */
export function optimizeReadability(text: string, targetScore: number = 65): string {
  let result = text;
  let currentScore = calculateFleschScore(result);
  
  // If score is too low (too complex), simplify
  if (currentScore < targetScore - 10) {
    // Break down long sentences
    result = result.replace(/([.!?])\s+([A-Z][^.!?]{50,})/g, '$1 $2');
    
    // Replace complex words with simpler alternatives
    const complexWords: Record<string, string> = {
      'comprehensive': 'complete',
      'implementation': 'putting into action',
      'optimization': 'improvement',
      'methodology': 'method',
      'facilitate': 'help',
      'utilize': 'use',
      'subsequently': 'then',
      'consequently': 'so'
    };
    
    Object.entries(complexWords).forEach(([complex, simple]) => {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      result = result.replace(regex, simple);
    });
  }
  
  // If score is too high (too simple), add some complexity
  else if (currentScore > targetScore + 10) {
    // Combine some short sentences
    result = result.replace(/([.!?])\s+([A-Z][^.!?]{10,20})/g, '$1 $2');
  }
  
  return result;
}

/**
 * Ultra-aggressive humanization for maximum AI detector resistance
 * Uses advanced techniques to create completely undetectable human writing
 */
export function ultraHumanizeText(inputText: string, persona: HumanizationPersona = 'blogger'): string {
  // First, deep clean the text
  let text = deepCleanText(inputText);

  // Remove AI jargon and business speak
  text = removeAIJargon(text);

  // Apply maximum intensity humanization
  text = addSubtleImperfections(text, 'aggressive');
  text = applyDetectorSubstitutions(text);
  text = addSentenceVariability(text);
  text = addEmotionalMarkers(text);
  text = humanizeTransitions(text);

  // Add ultra-human touches
  text = addUltraHumanTouches(text, persona);

  // Optimize readability for target Flesch score (60-70)
  text = optimizeReadability(text, 65);

  return text.trim();
}

/**
 * Add ultra-human touches for maximum detector resistance
 */
function addUltraHumanTouches(text: string, persona: HumanizationPersona): string {
  let result = text;

  // Add natural speech patterns
  const speechPatterns = [
    'you know what I mean',
    'if you think about it',
    'I guess what I\'m trying to say is',
    'it\'s like, you know',
    'I mean, honestly',
    'well, basically',
    'so yeah, that\'s the thing',
    'I don\'t know, maybe',
    'it\'s hard to explain but',
    'I feel like'
  ];

  // Insert speech patterns randomly
  const sentences = result.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 2) {
    const insertIndex = Math.floor(Math.random() * (sentences.length - 1)) + 1;
    const pattern = speechPatterns[Math.floor(Math.random() * speechPatterns.length)];
    sentences[insertIndex] = `${pattern}, ${sentences[insertIndex]}`;
    result = sentences.join('. ') + '.';
  }

  // Add natural interruptions and restarts
  if (Math.random() < 0.3) {
    const interruptions = [
      'Wait, let me rephrase that.',
      'Actually, scratch that.',
      'Hang on, I\'m getting ahead of myself.',
      'Let me start over.',
      'I\'m rambling, aren\'t I?'
    ];
    const interruption = interruptions[Math.floor(Math.random() * interruptions.length)];
    result = `${interruption} ${result}`;
  }

  // Add personal anecdotes occasionally
  if (Math.random() < 0.2) {
    const anecdotes = [
      'I remember when I first learned about this...',
      'It reminds me of this time...',
      'I was thinking about this the other day...',
      'This is something I\'ve been pondering...',
      'I had this conversation with a friend recently...'
    ];
    const anecdote = anecdotes[Math.floor(Math.random() * anecdotes.length)];
    result = `${anecdote} ${result}`;
  }

  return result;
}



/**
 * Enhanced ultra-human touches with emotional resonance and real-life examples
 */
export function addUltraAggressiveTouches(text: string, persona: HumanizationPersona): string {
  let result = text;

  // Add more natural speech patterns with higher frequency
  const aggressivePatterns = [
    'you know what I\'m saying',
    'I mean, like, you know',
    'it\'s kinda like, you know',
    'I guess what I\'m trying to get at is',
    'the thing is, you see',
    'well, you know how it is',
    'I don\'t know, it\'s just',
    'it\'s like, I don\'t know',
    'you get what I mean, right',
    'I\'m not sure how to put this but'
  ];

  // Insert patterns more frequently
  const sentences = result.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 3) {
    // Add patterns to multiple sentences
    const numToModify = Math.min(3, Math.floor(sentences.length / 3));
    for (let i = 0; i < numToModify; i++) {
      const insertIndex = Math.floor(Math.random() * (sentences.length - 1)) + 1;
      const pattern = aggressivePatterns[Math.floor(Math.random() * aggressivePatterns.length)];
      sentences[insertIndex] = `${pattern}, ${sentences[insertIndex]}`;
      result = sentences.join('. ') + '.';
    }
  }

  // Add more personal touches with emotional resonance
  const personalTouches = [
    'This reminds me of something my friend told me once...',
    'I was actually thinking about this the other day when...',
    'It\'s funny because I just had this conversation...',
    'You know what\'s interesting? I was reading about this...',
    'I remember learning about this in school and...'
  ];

  if (Math.random() < 0.4) { // Higher chance for ultra mode
    const touch = personalTouches[Math.floor(Math.random() * personalTouches.length)];
    result = `${touch} ${result}`;
  }

  // Add more natural interruptions
  if (Math.random() < 0.5) {
    const interruptions = [
      'Wait, that\'s not quite right.',
      'Actually, let me think about this differently.',
      'Hang on, I\'m getting confused.',
      'Let me rephrase that completely.',
      'I\'m not explaining this well.',
      'This is harder to explain than I thought.'
    ];
    const interruption = interruptions[Math.floor(Math.random() * interruptions.length)];
    result = `${interruption} ${result}`;
  }

  // Add conversational markers throughout
  const markers = ['right?', 'you know?', 'isn\'t it?', 'don\'t you think?', 'see what I mean?'];
  const words = result.split(' ');
  if (words.length > 20) {
    const insertPos = Math.floor(Math.random() * (words.length - 10)) + 10;
    const marker = markers[Math.floor(Math.random() * markers.length)];
    words.splice(insertPos, 0, marker);
    result = words.join(' ');
  }

  // Add sensory details for emotional resonance
  if (Math.random() < 0.3) {
    const sensoryDetails = [
      'It\'s like that feeling you get when...',
      'You know that moment when...',
      'It reminds me of the way...',
      'I can almost picture...',
      'It\'s similar to when you...'
    ];
    const detail = sensoryDetails[Math.floor(Math.random() * sensoryDetails.length)];
    result = `${detail} ${result}`;
  }

  return result;
}

/**
 * Enhanced human-likeness analysis with research-based metrics
 */
export function analyzeHumanLikeness(text: string): {
  score: number;
  factors: {
    sentenceVariation: number;
    contractionUsage: number;
    conversationalElements: number;
    naturalFlow: number;
    perplexity: number;
    burstiness: number;
    readability: number;
    jargonFree: number;
  };
  insights: {
    aiJargonCount: number;
    passiveVoiceCount: number;
    emotionalResonance: number;
    personalTouch: number;
  };
} {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Calculate sentence length variation (burstiness)
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
  const sentenceVariation = Math.min(Math.sqrt(variance) / avgLength, 1);
  
  // Check for contractions
  const contractionPattern = /\b\w+'\w+\b/g;
  const contractions = text.match(contractionPattern) || [];
  const contractionUsage = Math.min(contractions.length / sentences.length, 1);
  
  // Check for conversational elements
  const conversationalPattern = /(you know|honestly|basically|actually|in fact|at the end of the day)/gi;
  const conversationalElements = Math.min((text.match(conversationalPattern) || []).length / sentences.length, 1);
  
  // Check for natural flow indicators
  const naturalFlowPattern = /(well|though|plus|also|so)/gi;
  const naturalFlow = Math.min((text.match(naturalFlowPattern) || []).length / sentences.length, 1);
  
  // Calculate perplexity (unpredictability)
  const words = text.toLowerCase().split(/\s+/);
  const wordPairs = [];
  for (let i = 0; i < words.length - 1; i++) {
    wordPairs.push(`${words[i]} ${words[i + 1]}`);
  }
  const uniquePairs = new Set(wordPairs).size;
  const perplexity = Math.min(uniquePairs / wordPairs.length, 1);
  
  // Calculate burstiness (sentence length variation)
  const burstiness = Math.min(sentenceVariation, 1);
  
  // Calculate readability score
  const fleschScore = calculateFleschScore(text);
  const readability = Math.max(0, Math.min(1, (fleschScore - 30) / 70)); // Normalize 30-100 to 0-1
  
  // Check jargon-free content
  const jargonWords = ['leverage', 'facilitate', 'methodology', 'optimize', 'proprietary', 'utilize', 'furthermore', 'therefore', 'subsequently', 'consequently'];
  const jargonCount = jargonWords.reduce((count, jargon) => {
    const regex = new RegExp(`\\b${jargon}\\b`, 'gi');
    return count + (text.match(regex) || []).length;
  }, 0);
  const jargonFree = Math.max(0, 1 - (jargonCount / sentences.length));
  
  // Calculate insights
  const aiJargonCount = jargonCount;
  const passiveVoiceCount = (text.match(/\b(is|are|was|were)\s+(being\s+)?(done|performed|conducted|executed|implemented)\b/gi) || []).length;
  const emotionalResonance = (text.match(/(feeling|moment|picture|reminds|similar|like that)/gi) || []).length / sentences.length;
  const personalTouch = (text.match(/(I remember|I was thinking|It reminds me|my friend|I had this conversation)/gi) || []).length / sentences.length;
  
  const factors = {
    sentenceVariation: Math.round(sentenceVariation * 100) / 100,
    contractionUsage: Math.round(contractionUsage * 100) / 100,
    conversationalElements: Math.round(conversationalElements * 100) / 100,
    naturalFlow: Math.round(naturalFlow * 100) / 100,
    perplexity: Math.round(perplexity * 100) / 100,
    burstiness: Math.round(burstiness * 100) / 100,
    readability: Math.round(readability * 100) / 100,
    jargonFree: Math.round(jargonFree * 100) / 100
  };
  
  // Calculate overall score (weighted average with new factors)
  const score = Math.round(
    (sentenceVariation * 0.15 + 
     contractionUsage * 0.15 + 
     conversationalElements * 0.15 + 
     naturalFlow * 0.10 +
     perplexity * 0.15 +
     burstiness * 0.10 +
     readability * 0.10 +
     jargonFree * 0.10) * 100
  ) / 100;
  
  return { 
    score: Math.min(score, 1), 
    factors,
    insights: {
      aiJargonCount,
      passiveVoiceCount,
      emotionalResonance: Math.round(emotionalResonance * 100) / 100,
      personalTouch: Math.round(personalTouch * 100) / 100
    }
  };
}
