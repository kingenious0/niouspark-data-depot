'use server';
/**
 * @fileOverview A reusable Genkit tool to fetch user details from Firestore.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {adminAuth} from '@/lib/firebase-admin';

// This tool can be imported and used by multiple flows.
export const getUsersTool = ai.defineTool(
  {
    name: 'getUsers',
    description: 'Gets a list of all users, including their roles, names, and emails. Can also be used to get user counts.',
    inputSchema: z.object({}),
    outputSchema: z.object({
        totalUsers: z.number(),
        adminCount: z.number(),
        customerCount: z.number(),
        users: z.array(z.object({
            uid: z.string(),
            email: z.string().optional(),
            name: z.string().optional(),
            role: z.string(),
        }))
    }),
  },
  async () => {
    console.log('[getUsersTool] Fetching all users.');

    try {
        const userRecords = await adminAuth.listUsers();
        
        const users = userRecords.users.map(userRecord => {
            const customClaims = (userRecord.customClaims || {}) as { role?: 'admin' | 'customer' };
            return {
                uid: userRecord.uid,
                email: userRecord.email,
                name: userRecord.displayName,
                role: customClaims.role || 'customer',
            };
        });

        const adminCount = users.filter(u => u.role === 'admin').length;
        const customerCount = users.length - adminCount;

        const result = {
            totalUsers: users.length,
            adminCount,
            customerCount,
            users,
        };
        
        console.log(`[getUsersTool] Returning ${result.totalUsers} total users.`);
        return result;

    } catch (error) {
        console.error('[getUsersTool] Error fetching users:', error);
        throw new Error('Failed to retrieve user list from the database.');
    }
  }
);
