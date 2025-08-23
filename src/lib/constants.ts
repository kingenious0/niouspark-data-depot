// Shared constants that can be used on both client and server
export const WORD_LIMIT = 2000;

// Paraphrasing options
export const VALID_TONES = ['formal', 'casual', 'academic'] as const;
export const VALID_MODES = ['paraphrase', 'humanize', 'simplify', 'ultra-humanize', 'wep-humanize'] as const;

// Humanization personas for AI detector resistance
export const HUMANIZATION_PERSONAS = {
  student: {
    name: 'College Student',
    description: 'Casual, conversational, with natural imperfections',
    characteristics: ['contractions', 'casual connectors', 'varied sentence length', 'occasional redundancy']
  },
  blogger: {
    name: 'Content Blogger',
    description: 'Engaging, personal, with conversational flow',
    characteristics: ['personal anecdotes', 'transitional phrases', 'mixed formality', 'reader engagement']
  },
  journalist: {
    name: 'News Writer', 
    description: 'Clear, direct, with deadline urgency',
    characteristics: ['concise statements', 'varied structure', 'factual tone', 'natural flow']
  },
  professional: {
    name: 'Business Professional',
    description: 'Polished but human, with subtle informality',
    characteristics: ['balanced formality', 'clear communication', 'purposeful structure', 'human touch']
  }
} as const;

// Conversational fillers and connectors humans use
export const HUMAN_CONNECTORS = [
  'You know,', 'Honestly,', 'At the end of the day,', 'For example,', 'In other words,',
  'That said,', 'On the other hand,', 'Basically,', 'Simply put,', 'To put it differently,',
  'What\'s more,', 'In fact,', 'Actually,', 'Interestingly,', 'Surprisingly,'
];

export type Tone = typeof VALID_TONES[number];
export type Mode = typeof VALID_MODES[number];
export type HumanizationPersona = keyof typeof HUMANIZATION_PERSONAS;
