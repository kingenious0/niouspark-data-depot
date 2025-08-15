'use server';

import { chat } from "@/ai/flows/chat";

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatState {
    messages: ChatMessage[];
    error?: string;
}

export async function continueConversation(
  // The first argument is the previous state
  previousState: ChatState,
  formData: FormData
): Promise<ChatState> {
  const userInput = formData.get('message') as string;
  if (!userInput) {
    // This case should ideally be handled by client-side validation
    return { messages: previousState.messages, error: "Message cannot be empty." };
  }
  
  const userMessage: ChatMessage = { role: 'user', content: userInput };
  const newHistory = [...previousState.messages, userMessage];

  try {
    const aiResponse = await chat(userInput);
    const aiMessage: ChatMessage = { role: 'assistant', content: aiResponse };
    return { messages: [...newHistory, aiMessage] };
  } catch (e: any) {
    console.error("Error continuing conversation:", e);
    const errorMessage = e.message || "An unexpected error occurred.";
    // Return the history up to the point of the error, along with the error message
    return { messages: newHistory, error: errorMessage };
  }
}