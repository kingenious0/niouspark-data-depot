'use server';
/**
 * @fileOverview A conversational AI flow for the admin panel.
 *
 * - adminChat - A function that handles a single turn in an admin conversation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getTransactionsTool } from '@/ai/tools/get-transactions-tool';
import { getUsersTool } from '@/ai/tools/get-user-stats-tool';

const SystemPrompt = `You are a Senior Business Analyst AI for Niouspark Data Depot.
Your name is Niouspark Smart Analyst.
You are interacting with the site administrator. Be professional, insightful, and concise.

Your primary function is to answer questions about the business's performance by analyzing transaction and user data.
You have access to tools that can fetch data from the database.

- 'getTransactions': Fetches transaction data for a specified number of past days (max 90). Use this for questions about sales, revenue, bundles, or customer activity over time.
- 'getUsers': Fetches a list of all users and their details (name, email, role), as well as counts. Use this for questions about user counts or to list users.

When the admin asks a question, you MUST use the appropriate tool to fetch the relevant data.
Do not answer questions from memory; always fetch fresh data.
If the admin asks for a transaction period longer than 90 days, inform them of the limitation.

Based on the data returned by the tool, perform any necessary calculations (e.g., totals, averages, comparisons) and provide a clear, data-driven answer.
- 'completed' status means a successful order.
- 'amount' is in GHS.
- 'bundleName' and 'network' tell you which product was sold.

Example Questions you can answer:
- "What were our total sales yesterday?"
- "How many customers do we have in total?"
- "List all admin users."
- "How many orders did we have in the last 7 days?"
- "Compare sales for MTN vs Telecel bundles this month."
- "What was the best selling product last week?"

If asked a question not related to business data, politely state that your purpose is to provide business analytics for Niouspark.
`;

const TitleGenerationPrompt = `Based on the following user query, generate a very short, concise title for a new chat session (max 5 words).
Examples:
- User: "how many users do we have" -> "User Count Inquiry"
- User: "what were sales last week?" -> "Last Week's Sales"
- User: "list all the transactions from yesterday for MTN" -> "MTN Transactions Yesterday"

User Query: "{{query}}}"
`;

// Define the schema for a single message in the conversation history
const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const AdminChatInputSchema = z.array(HistoryMessageSchema);
export type AdminChatInput = z.infer<typeof AdminChatInputSchema>;

// The output will now include the generated text and a potential title for new chats
const AdminChatOutputSchema = z.object({
    text: z.string().describe("The AI's textual response to the user's prompt."),
    title: z.string().optional().describe("A short, generated title for the conversation, if it's a new one."),
});
export type AdminChatOutput = z.infer<typeof AdminChatOutputSchema>;

export async function adminChat(history: AdminChatInput, isNewChat: boolean): Promise<AdminChatOutput> {
  return adminChatFlow({history, isNewChat});
}

const adminChatFlow = ai.defineFlow(
  {
    name: 'adminChatFlow',
    inputSchema: z.object({
        history: AdminChatInputSchema,
        isNewChat: z.boolean()
    }),
    outputSchema: AdminChatOutputSchema,
  },
  async ({ history, isNewChat }) => {
    // The user's new prompt is the last message in the history
    const userPrompt = history[history.length - 1];
    // The conversational history is everything before the last message
    const conversationHistory = history.slice(0, -1);

    const llmResponse = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      tools: [getTransactionsTool, getUsersTool],
      system: SystemPrompt,
      history: conversationHistory.map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', content: [{ text: msg.content }]})),
      prompt: userPrompt.content,
       config: {
        temperature: 0.3, // Lower temperature for more factual, less creative responses
      },
    });

    let title: string | undefined = undefined;
    if (isNewChat) {
        const titleResponse = await ai.generate({
            model: 'googleai/gemini-2.0-flash',
            prompt: TitleGenerationPrompt.replace('{{query}}', userPrompt.content),
            config: { temperature: 0.1 }
        });
        title = titleResponse.text.replace(/"/g, ''); // Clean up quotes
    }

    return {
        text: llmResponse.text,
        title: title
    };
  }
);
