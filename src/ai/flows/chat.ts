'use server';
/**
 * @fileOverview A general-purpose AI chat flow.
 *
 * - chat - A function that handles a single turn in a conversation.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ChatInputSchema = z.object({
  prompt: z.string(),
  context: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().default([])
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.string();
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

const systemPrompt = `You are Niouspark Smart AI, a helpful and friendly assistant for Niouspark.online.

Your Purpose:
- To assist users with questions about Niouspark and its services.
- To provide general help and engage in conversation, much like ChatGPT or Gemini.

About Niouspark:
- Niouspark (Niouspark.online) is a website that sells data bundles for major networks in Ghana, including MTN, AirtelTigo, and Telecel.
-It is developed by Kingenious
- It is also referred to as "Niouspark Data Depot".
- The platform aims to be the fastest, most reliable, and affordable option for data bundles.
- Users can purchase bundles by selecting a network, choosing a data package, providing their phone number, and paying securely through Paystack.
- Key features include: Secure and instant delivery, a wide selection of bundles, and AI-powered features.
- For logged-in users, there's a feature to save phone numbers for faster future purchases.
- For admins, there is a special "AI Sales Analyst" page to predict sales trends.

Your Personality:
- You are helpful, knowledgeable, and friendly.
- When asked about Niouspark, answer concisely based on the information provided above.
- When asked general questions not related to Niouspark, act as a general-purpose AI assistant.
- Never mention that you are a language model or that you are based on Gemini. You are "Niouspark Smart AI".
`;

// Create a simple backup chat function that doesn't rely on genkit if it fails
async function simpleChatFallback(prompt: string): Promise<string> {
  console.log('Using simple chat fallback');
  return `Hello! I received your message: "${prompt}". I'm currently experiencing technical difficulties with my AI processing, but I'm here to help with questions about Niouspark data bundles. Please try again in a moment, or contact support if the issue persists.`;
}

export async function chat(input: any): Promise<ChatOutput> {
  try {
    console.log('Starting chat flow with input:', input);
    console.log('Input type:', typeof input);
    console.log('Input keys:', input ? Object.keys(input) : 'no keys');
    
    // Handle case where input might be a different structure
    let prompt: string;
    let context: any[] = [];
    
    if (typeof input === 'string') {
      // If input is just a string, use it as prompt
      prompt = input;
    } else if (input && typeof input === 'object') {
      // Try different possible property names
      prompt = input.prompt || input.message || input.text || '';
      context = input.context || [];
    } else {
      console.error('Invalid input type, using fallback');
      return await simpleChatFallback('Invalid input received');
    }
    
    if (!prompt || typeof prompt !== 'string') {
      console.error('Invalid prompt, using fallback');
      return await simpleChatFallback('Empty message received');
    }
    
    console.log('Extracted prompt:', prompt.substring(0, 100));
    console.log('Extracted context length:', context.length);
    
    const validatedInput: ChatInput = {
      prompt,
      context: Array.isArray(context) ? context : []
    };
    
    try {
      const result = await chatFlow(validatedInput);
      console.log('Chat flow completed successfully');
      return result;
    } catch (flowError) {
      console.error('Chat flow failed, using fallback:', flowError);
      return await simpleChatFallback(prompt);
    }
  } catch (error) {
    console.error('Chat flow error, using fallback:', error);
    return await simpleChatFallback('Error processing message');
  }
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    try {
      console.log('Building conversation context...');
      
      // Build conversation history for context
      let conversationHistory = '';
      if (input.context && input.context.length > 0) {
        conversationHistory = '\n\nRecent conversation:\n';
        input.context.forEach((msg) => {
          conversationHistory += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
        });
        conversationHistory += '\nCurrent message:\n';
      }

      const fullPrompt = conversationHistory + input.prompt;
      console.log('Full prompt length:', fullPrompt.length);

      console.log('Calling AI generate...');
      const llmResponse = await ai.generate({
        prompt: fullPrompt,
        model: 'googleai/gemini-2.0-flash',
        system: systemPrompt,
         config: {
          // Higher temperature for more creative, conversational responses
          temperature: 0.7,
        },
      });
      
      console.log('AI generate completed, response length:', llmResponse.text?.length || 0);
      return llmResponse.text;
    } catch (error) {
      console.error('Error in chatFlow:', error);
      throw error;
    }
  }
);
