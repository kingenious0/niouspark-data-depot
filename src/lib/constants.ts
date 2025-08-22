// Shared constants that can be used on both client and server
export const WORD_LIMIT = 2000;

// Paraphrasing options
export const VALID_TONES = ['formal', 'casual', 'academic'] as const;
export const VALID_MODES = ['paraphrase', 'humanize', 'simplify'] as const;

export type Tone = typeof VALID_TONES[number];
export type Mode = typeof VALID_MODES[number];
