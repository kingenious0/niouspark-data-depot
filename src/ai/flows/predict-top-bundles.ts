
'use server';
/**
 * @fileOverview AI flow to analyze historical sales data.
 *
 * - analyzeSalesData - A function that fetches and analyzes sales data.
 * - SalesAnalysisOutput - The return type for the analyzeSalesData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {adminDb} from '@/lib/firebase-admin';
import {Timestamp} from 'firebase-admin/firestore';
import type {AdminTransaction} from '@/lib/datamart';

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

// Tool to fetch transactions from Firestore
const getTransactionsTool = ai.defineTool(
  {
    name: 'getTransactions',
    description:
      'Fetches transaction records from the database for a given number of past days.',
    inputSchema: z.object({
      days: z
        .number()
        .describe('The number of past days to fetch transactions for.'),
    }),
    outputSchema: z.array(
      z.object({
        _id: z.string(),
        amount: z.number(),
        status: z.string(),
        reference: z.string(),
        createdAt: z.string(),
        bundleName: z.string().optional(),
      })
    ),
  },
  async ({days}) => {
    console.log(`Fetching transactions for the last ${days} days.`);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Fetch all transactions and filter in-memory to avoid index issues.
    const snapshot = await adminDb
      .collection('transactions')
      .orderBy('createdAt', 'desc')
      .get();
      
    const allTransactions = snapshot.docs.map(doc => {
        const data = doc.data();
        let createdAt = new Date(); // Default to now if not available
        if (data.createdAt) {
          if (data.createdAt.toDate) {
            createdAt = data.createdAt.toDate();
          } else if (typeof data.createdAt === 'string') {
            createdAt = new Date(data.createdAt);
          }
        }
        return {
          _id: doc.id,
          amount: data.amount,
          status: data.status,
          reference: data.reference,
          createdAt: createdAt,
          bundleName: data.bundleName,
          docData: data,
        };
      });
      
    const filteredDocs = allTransactions.filter(t => t.createdAt >= startDate);

    if (filteredDocs.length === 0) {
      return [];
    }
    
    const transactions: Partial<AdminTransaction>[] = filteredDocs.map(
      t => ({
        _id: t._id,
        amount: t.amount,
        status: t.status,
        reference: t.reference,
        createdAt: t.createdAt.toISOString(),
        bundleName: t.bundleName,
      })
    );
    
    return transactions as any;
  }
);

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
  tools: [getTransactionsTool],
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
    // Fetch data for all periods in parallel
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
