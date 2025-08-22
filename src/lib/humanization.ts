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
 * Analyzes text characteristics to determine human-likeness score
 */
export function analyzeHumanLikeness(text: string): {
  score: number;
  factors: {
    sentenceVariation: number;
    contractionUsage: number;
    conversationalElements: number;
    naturalFlow: number;
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
  
  const factors = {
    sentenceVariation: Math.round(sentenceVariation * 100) / 100,
    contractionUsage: Math.round(contractionUsage * 100) / 100,
    conversationalElements: Math.round(conversationalElements * 100) / 100,
    naturalFlow: Math.round(naturalFlow * 100) / 100
  };
  
  // Calculate overall score (weighted average)
  const score = Math.round(
    (sentenceVariation * 0.3 + 
     contractionUsage * 0.25 + 
     conversationalElements * 0.25 + 
     naturalFlow * 0.2) * 100
  ) / 100;
  
  return { score: Math.min(score, 1), factors };
}
