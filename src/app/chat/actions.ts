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
import { enhanceChatWithPuter } from "@/lib/puter-ai";

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
    console.log('Loading chat state...');
    
    // Validate environment first
    const envValidation = validateEnvironment();
    console.log('Environment validation:', envValidation);
    
    if (!envValidation.isValid) {
      console.error('Environment validation failed:', envValidation.missing);
      return {
        messages: [{ role: 'assistant', content: "Hello! AI Chat is currently unavailable due to missing configuration. Please contact support." }],
        error: `Missing configuration: ${envValidation.missing.join(', ')}`
      };
    }

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
      try {
        await addMessageToChat(userId, chatId, welcomeMessage);
      } catch (addError) {
        console.error('Error adding welcome message:', addError);
        // Continue anyway with local message
      }
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
      error: "Failed to load chat history. Starting fresh."
    };
  }
}

export async function continueConversation(
  // The first argument is the previous state
  previousState: ChatState,
  formData: FormData
): Promise<ChatState> {
  try {
    console.log('Starting continueConversation...');
    
    const userInput = formData.get('message') as string;
    console.log('User input received:', userInput ? userInput.substring(0, 100) : 'empty');
    
    if (!userInput || !userInput.trim()) {
      console.log('Empty message provided');
      return { ...previousState, error: "Message cannot be empty." };
    }
    
    // Validate environment variables first
    console.log('Validating environment...');
    const envValidation = validateEnvironment();
    console.log('Environment validation result:', envValidation);
    
    if (!envValidation.isValid) {
      console.error('Environment validation failed:', envValidation.missing);
      return {
        ...previousState,
        error: `AI Chat is temporarily unavailable. Missing configuration: ${envValidation.missing.join(', ')}. Please contact support.`
      };
    }
    
    console.log('Getting current user ID...');
    const userId = await getCurrentUserId();
    console.log('User ID:', userId ? 'found' : 'not found');
    
    if (!userId) {
      return { 
        ...previousState, 
        error: "User not authenticated. Please log in to continue chatting." 
      };
    }

    // Get or create chat ID
    console.log('Getting or creating chat ID...');
    let chatId = previousState.chatId;
    if (!chatId) {
      console.log('No existing chat ID, creating new chat...');
      chatId = await getOrCreateCurrentChat(userId);
      console.log('New chat created with ID:', chatId ? 'success' : 'failed');
    } else {
      console.log('Using existing chat ID');
    }

    // Add user message to Firestore
    console.log('Adding user message to Firestore...');
    const userMessage: ChatMessage = { role: 'user', content: userInput };
    await addMessageToChat(userId, chatId, userMessage);
    console.log('User message added successfully');
    
    // Get recent context for the AI
    console.log('Getting chat context...');
    const context = await getChatContext(userId, chatId, 8); // Last 8 messages for context
    console.log('Context retrieved, message count:', context.length);
    
    // Call AI with context - Enhanced with Puter AI
    console.log('Calling AI chat function with Puter enhancement...');
    console.log('userInput:', userInput);
    console.log('context before processing:', context);
    
    const processedContext = context.slice(-8).map(msg => ({ 
      role: msg.role, 
      content: msg.content 
    }));
    console.log('processedContext:', processedContext);
    
    // First try Puter AI enhancement (client-side will be available)
    // For now, use Gemini as primary with future Puter enhancement
    const chatInput = {
      prompt: userInput,
      context: processedContext
    };
    console.log('Final chat input object:', chatInput);
    
    let aiResponse = await chat(chatInput);
    console.log('Primary AI response received:', aiResponse ? 'success' : 'failed');
    
    // Note: Puter AI enhancement will be applied on client-side for browser compatibility
    
    // Add AI response to Firestore
    console.log('Adding AI response to Firestore...');
    const aiMessage: ChatMessage = { role: 'assistant', content: aiResponse };
    await addMessageToChat(userId, chatId, aiMessage);
    console.log('AI message added successfully');
    
    // Get updated messages
    console.log('Getting updated chat messages...');
    const updatedChat = await getChat(userId, chatId);
    const messages = updatedChat?.messages.map(msg => ({ role: msg.role, content: msg.content })) || [];
    console.log('Updated messages retrieved, count:', messages.length);
    
    console.log('continueConversation completed successfully');
    return { messages, chatId };
  } catch (e: any) {
    console.error("Error continuing conversation:", e);
    
    // Handle specific error types
    let errorMessage = "An unexpected error occurred. Please try again.";
    
    if (e.message) {
      if (e.message.includes('auth') || e.message.includes('unauthorized')) {
        errorMessage = "Authentication error. Please log out and log back in.";
      } else if (e.message.includes('network') || e.message.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (e.message.includes('quota') || e.message.includes('limit')) {
        errorMessage = "Service temporarily unavailable due to high demand. Please try again later.";
      } else if (e.message.includes('firebase') || e.message.includes('firestore')) {
        errorMessage = "Database error. Please try again in a moment.";
      } else {
        errorMessage = "AI service is temporarily unavailable. Please try again later.";
      }
    }
    
    return { ...previousState, error: errorMessage };
  } finally {
    // Ensure we always return a valid state
  }
}
