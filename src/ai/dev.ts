import { config } from 'dotenv';
config();

import '@/ai/flows/predict-top-bundles.ts';
import '@/ai/flows/chat.ts';
import '@/ai/flows/admin-chat.ts';
import '@/ai/tools/get-user-stats-tool';
import '@/ai/tools/get-transactions-tool';