import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

console.log('Initializing Genkit AI...');

let ai: ReturnType<typeof genkit>;

try {
  ai = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-2.0-flash',
  });
  console.log('Genkit AI initialized successfully');
} catch (error) {
  console.error('Failed to initialize Genkit AI:', error);
  throw error;
}

export { ai };
