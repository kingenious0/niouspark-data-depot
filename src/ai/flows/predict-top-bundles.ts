
'use server';
/**
 * @fileOverview AI flow to analyze historical sales data.
 *
 * - analyzeSalesData - A function that fetches and analyzes sales data.
 * - SalesAnalysisOutput - The return type for the analyzeSalesData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getTransactionsTool } from '@/ai/tools/get-transactions-tool';

// Define the output schema for one analysis period
const PeriodAnalysisSchema = z.object({
  totalSales: z.number().describe('Total sales amount in this period.'),
  totalOrders: z.number().describe('Total number of completed orders in this period.'),
  totalPendingOrders: z.number().describe('Total number of pending orders in this period.'),
  bestSellingBundle: z
    .string()
    .describe('The name of the best-selling bundle in this period.'),
  summary: z
    .string()
    .describe(
      'A brief, one or two sentence summary of the sales activity in this period.'
    ),
});

// Define the final output schema for all periods
const SalesAnalysisOutputSchema = z.object({
  last3Days: PeriodAnalysisSchema,
  last7Days: PeriodAnalysisSchema,
  last30Days: PeriodAnalysisSchema,
});
export type SalesAnalysisOutput = z.infer<typeof SalesAnalysisOutputSchema>;


// Define the main prompt for analysis
const analysisPrompt = ai.definePrompt({
  name: 'salesAnalysisPrompt',
  input: {
    schema: z.object({
      transactions3days: z.any(),
      transactions7days: z.any(),
      transactions30days: z.any(),
    }),
  },
  output: {schema: SalesAnalysisOutputSchema},
  prompt: `You are a business intelligence analyst for a data bundle company.
  Your task is to analyze the provided sales data for the last 3, 7, and 30 days.

  For each period, calculate the total sales from 'completed' orders, total number of 'completed' orders, the total number of 'pending' orders, and identify the best-selling bundle from the 'completed' orders.
  Then, provide a short, insightful summary of the sales activity for that period.

  Use the provided transaction data to perform your analysis.
  ---
  3-Day Data:
  {{{json transactions3days}}}
  ---
  7-Day Data:
  {{{json transactions7days}}}
  ---
  30-Day Data:
  {{{json transactions30days}}}
  ---
  `,
});

// Define the flow that orchestrates fetching and analyzing data
const analyzeSalesFlow = ai.defineFlow(
  {
    name: 'analyzeSalesFlow',
    inputSchema: z.null(),
    outputSchema: SalesAnalysisOutputSchema,
  },
  async () => {
    // Fetch data for all periods in parallel using the imported tool
    const [transactions3days, transactions7days, transactions30days] =
      await Promise.all([
        getTransactionsTool({days: 3}),
        getTransactionsTool({days: 7}),
        getTransactionsTool({days: 30}),
      ]);

    const {output} = await analysisPrompt({
      transactions3days,
      transactions7days,
      transactions30days,
    });

    return output!;
  }
);

export async function analyzeSalesData(): Promise<SalesAnalysisOutput> {
  return analyzeSalesFlow(null);
}