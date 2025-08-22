'use server';

import { chat } from "@/ai/flows/chat";
import { 
  getCurrentUserId, 
  getOrCreateCurrentChat, 
  addMessageToChat, 
  getChatContext,
  getChat
} from "@/lib/chat-service";
import { validateEnvironment } from "@/lib/env-config";

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatState {
    messages: ChatMessage[];
    chatId?: string;
    error?: string;
}

// New action to load initial chat state
export async function loadChatState(): Promise<ChatState> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { 
        messages: [{ role: 'assistant', content: "Hello! Please log in to start chatting with me." }],
        error: "User not authenticated"
      };
    }

    const chatId = await getOrCreateCurrentChat(userId);
    const chatData = await getChat(userId, chatId);
    
    if (!chatData || chatData.messages.length === 0) {
      // New chat, add welcome message
      const welcomeMessage = { role: 'assistant' as const, content: "Hello! I'm Niouspark Smart AI. How can I help you today?" };
      await addMessageToChat(userId, chatId, welcomeMessage);
      return { 
        messages: [welcomeMessage], 
        chatId 
      };
    }
    
    return { 
      messages: chatData.messages.map(msg => ({ role: msg.role, content: msg.content })), 
      chatId 
    };
  } catch (error) {
    console.error('Error loading chat state:', error);
    return { 
      messages: [{ role: 'assistant', content: "Hello! I'm Niouspark Smart AI. How can I help you today?" }],
      error: "Failed to load chat history"
    };
  }
}

export async function continueConversation(
  // The first argument is the previous state
  previousState: ChatState,
  formData: FormData
): Promise<ChatState> {
  const userInput = formData.get('message') as string;
  if (!userInput) {
    // This case should ideally be handled by client-side validation
    return { ...previousState, error: "Message cannot be empty." };
  }
  
  // Validate environment variables
  const envValidation = validateEnvironment();
  if (!envValidation.isValid) {
    return {
      ...previousState,
      error: `AI Chat is temporarily unavailable. Missing configuration: ${envValidation.missing.join(', ')}. Please contact support.`
    };
  }
  
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { 
        ...previousState, 
        error: "User not authenticated. Please log in to continue chatting." 
      };
    }

    // Get or create chat ID
    let chatId = previousState.chatId;
    if (!chatId) {
      chatId = await getOrCreateCurrentChat(userId);
    }

    // Add user message to Firestore
    const userMessage: ChatMessage = { role: 'user', content: userInput };
    await addMessageToChat(userId, chatId, userMessage);
    
    // Get recent context for the AI
    const context = await getChatContext(userId, chatId, 8); // Last 8 messages for context
    
    // Call AI with context
    const aiResponse = await chat({
      prompt: userInput,
      context: context.slice(-8).map(msg => ({ role: msg.role, content: msg.content }))
    });
    
    // Add AI response to Firestore
    const aiMessage: ChatMessage = { role: 'assistant', content: aiResponse };
    await addMessageToChat(userId, chatId, aiMessage);
    
    // Get updated messages
    const updatedChat = await getChat(userId, chatId);
    const messages = updatedChat?.messages.map(msg => ({ role: msg.role, content: msg.content })) || [];
    
    return { messages, chatId };
  } catch (e: any) {
    console.error("Error continuing conversation:", e);
    const errorMessage = e.message || "An unexpected error occurred.";
    return { ...previousState, error: errorMessage };
  }
}
