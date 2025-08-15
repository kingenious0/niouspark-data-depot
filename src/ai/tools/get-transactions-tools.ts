'use server';
/**
 * @fileOverview A reusable Genkit tool to fetch transaction data from Firestore.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {adminDb} from '@/lib/firebase-admin';
import type {AdminTransaction} from '@/lib/datamart';

// This tool can be imported and used by multiple flows.
export const getTransactionsTool = ai.defineTool(
  {
    name: 'getTransactions',
    description:
      'Fetches transaction records from the database for a given number of past days. The maximum is 90 days.',
    inputSchema: z.object({
      days: z
        .number()
        .describe('The number of past days to fetch transactions for. Max 90.'),
    }),
    outputSchema: z.array(
      z.object({
        _id: z.string(),
        amount: z.number(),
        status: z.string(),
        reference: z.string(),
        createdAt: z.string(),
        bundleName: z.string().optional(),
        network: z.string().optional(),
      })
    ),
  },
  async ({days}) => {
    // Safety clamp to 90 days max
    const lookbackDays = Math.min(days, 90);
    console.log(`[getTransactionsTool] Fetching transactions for the last ${lookbackDays} days.`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);
    
    // Fetch all transactions and filter in-memory to avoid complex index requirements.
    // This is less efficient for very large datasets but more flexible for an MVP.
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
          network: data.network,
        };
      });
      
    const filteredDocs = allTransactions.filter(t => t.createdAt >= startDate);

    if (filteredDocs.length === 0) {
      console.log(`[getTransactionsTool] Found no transactions in the last ${lookbackDays} days.`);
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
        network: t.network
      })
    );
    
    console.log(`[getTransactionsTool] Returning ${transactions.length} transactions.`);
    return transactions as any;
  }
);