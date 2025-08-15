
'use server';

import { adminChat } from "@/ai/flows/admin-chat";
import { analyzeSalesData } from "@/ai/flows/predict-top-bundles";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

// --- Chat Types ---
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatSession {
    id: string;
    title: string;
    updatedAt: string; // ISO string
}

export interface ChatState {
    chatId: string | null;
    messages: ChatMessage[];
    newSession?: ChatSession;
    error?: string;
}

// --- Chat Actions ---

async function getAdminUid(authHeader?: string | null): Promise<string> {
    if (!authHeader) throw new Error("Unauthorized");
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.role !== 'admin') throw new Error("Forbidden");
    return decodedToken.uid;
}

export async function getChatSessions(authHeader: string): Promise<ChatSession[]> {
    try {
        const adminId = await getAdminUid(authHeader);
        const snapshot = await adminDb.collection('adminChats')
            .where('adminId', '==', adminId)
            .orderBy('updatedAt', 'desc')
            .limit(50)
            .get();
        
        if (snapshot.empty) return [];

        return snapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title || 'Untitled Chat',
            updatedAt: (doc.data().updatedAt as Timestamp).toDate().toISOString()
        }));
    } catch (e: any) {
        console.error("Error getting chat sessions:", e);
        // Return empty instead of throwing to avoid crashing the client UI
        return [];
    }
}

export async function getChatMessages(chatId: string, authHeader: string): Promise<ChatMessage[]> {
    try {
        const adminId = await getAdminUid(authHeader);
        const docRef = adminDb.collection('adminChats').doc(chatId);
        const docSnap = await docRef.get();

        if (!docSnap.exists || docSnap.data()?.adminId !== adminId) {
            throw new Error("Chat not found or access denied");
        }
        return docSnap.data()?.messages || [];
    } catch (e: any) {
        console.error(`Error getting messages for chat ${chatId}:`, e);
        return [];
    }
}


export async function continueAdminConversation(
  previousState: ChatState,
  formData: FormData
): Promise<ChatState> {
  const userInput = formData.get('message') as string;
  const chatId = formData.get('chatId') as string | null;
  const authHeader = formData.get('authHeader') as string;
  const currentMessages = JSON.parse(formData.get('messages') as string || '[]') as ChatMessage[];

  // This is a state update call, not a message submission. Return previous state.
  if (!userInput) {
    return { ...previousState, error: undefined, newSession: undefined };
  }
   if (!authHeader) {
    return { ...previousState, error: "Authentication token missing.", newSession: undefined };
  }

  const adminId = await getAdminUid(authHeader);
  const userMessage: ChatMessage = { role: 'user', content: userInput };
  const newHistoryForAI: ChatMessage[] = [...currentMessages, userMessage];

  let currentChatId = chatId;
  let newChatCreated = false;
  let newSession: ChatSession | undefined = undefined;

  try {
     // If there's no chatId, it's a new conversation
    if (!currentChatId) {
      newChatCreated = true;
      const docRef = await adminDb.collection('adminChats').add({
        adminId,
        title: `Chat started on ${new Date().toLocaleDateString()}`, // Placeholder title
        messages: [userMessage],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      currentChatId = docRef.id;
      console.log(`Created new chat session: ${currentChatId}`);
    } else {
      // It's an existing chat, just add the new user message
      const docRef = adminDb.collection('adminChats').doc(currentChatId);
      await docRef.update({
        messages: FieldValue.arrayUnion(userMessage),
        updatedAt: Timestamp.now(),
      });
    }

    // Call the AI
    const aiResponse = await adminChat(newHistoryForAI, newChatCreated);
    const aiMessage: ChatMessage = { role: 'assistant', content: aiResponse.text };

    // Save the AI response to the database
    const docRef = adminDb.collection('adminChats').doc(currentChatId!);
    const updatePayload: { [key: string]: any } = {
        messages: FieldValue.arrayUnion(aiMessage),
        updatedAt: Timestamp.now(),
    };
    // If it was a new chat, also update the title with the AI-generated one
    if (newChatCreated && aiResponse.title) {
        updatePayload.title = aiResponse.title;
        newSession = {
            id: currentChatId!,
            title: aiResponse.title,
            updatedAt: new Date().toISOString()
        }
    }
    await docRef.update(updatePayload);

    return {
      chatId: currentChatId,
      messages: [...newHistoryForAI, aiMessage],
      newSession: newSession,
      error: undefined,
    };
  } catch (e: any) {
    console.error("Error in admin conversation action:", e);
    const errorMessage = e.message || "An unexpected error occurred.";
    return {
        chatId: currentChatId,
        messages: newHistoryForAI, // Show the user's message even if AI fails
        error: errorMessage,
        newSession: undefined
    };
  }
}

// --- Prediction Actions ---

export type SalesAnalysisState = {
  data: {
    last3Days: {
        totalSales: number;
        totalOrders: number;
        bestSellingBundle: string;
        summary: string;
        totalPendingOrders: number;
    };
    last7Days: {
        totalSales: number;
        totalOrders: number;
        bestSellingBundle: string;
        summary: string;
        totalPendingOrders: number;
    };
    last30Days: {
        totalSales: number;
        totalOrders: number;
        bestSellingBundle: string;
        summary: string;
        totalPendingOrders: number;
    };
  } | null;
  error: string | null;
};

export async function getSalesAnalysis(
  prevState: SalesAnalysisState,
  formData: FormData
): Promise<SalesAnalysisState> {
  try {
    const result = await analyzeSalesData();
    return { data: result, error: null };
  } catch (e: any) {
    console.error("Error getting sales analysis:", e);
    return { data: null, error: e.message || "An unexpected error occurred." };
  }
}