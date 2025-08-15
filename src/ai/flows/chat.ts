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

const ChatInputSchema = z.string();
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

export async function chat(prompt: ChatInput): Promise<ChatOutput> {
  return chatFlow(prompt);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (prompt) => {
    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.0-flash',
      system: systemPrompt,
       config: {
        // Higher temperature for more creative, conversational responses
        temperature: 0.7,
      },
    });

    return llmResponse.text;
  }
);