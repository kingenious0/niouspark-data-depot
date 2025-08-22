import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  orderBy, 
  query, 
  limit, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { verifyIdToken } from './firebase-admin';
import { cookies } from 'next/headers';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

// Server-side function to get current user ID from token
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const idToken = cookieStore.get('id_token')?.value;
    if (!idToken) return null;
    
    const decodedToken = await verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

// Create a new chat for the user
export async function createChat(userId: string, firstMessage?: string): Promise<string> {
  try {
    const chatData = {
      userId,
      title: firstMessage ? firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '') : 'New Chat',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messages: []
    };

    const chatRef = await addDoc(collection(db, 'users', userId, 'chats'), chatData);
    return chatRef.id;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw new Error('Failed to create chat');
  }
}

// Get a specific chat by ID
export async function getChat(userId: string, chatId: string): Promise<Chat | null> {
  try {
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      return null;
    }
    
    const data = chatSnap.data();
    return {
      id: chatSnap.id,
      title: data.title,
      userId: data.userId,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      messages: (data.messages || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp?.toDate() || new Date()
      }))
    };
  } catch (error) {
    console.error('Error getting chat:', error);
    throw new Error('Failed to get chat');
  }
}

// Get user's most recent chat or create a new one
export async function getOrCreateCurrentChat(userId: string): Promise<string> {
  try {
    const chatsRef = collection(db, 'users', userId, 'chats');
    const q = query(chatsRef, orderBy('updatedAt', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
    
    // No existing chat, create a new one
    return await createChat(userId);
  } catch (error) {
    console.error('Error getting or creating current chat:', error);
    throw new Error('Failed to get or create chat');
  }
}

// Add a message to a chat
export async function addMessageToChat(
  userId: string, 
  chatId: string, 
  message: Omit<ChatMessage, 'timestamp'>
): Promise<void> {
  try {
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      throw new Error('Chat not found');
    }
    
    const chatData = chatSnap.data();
    const currentMessages = chatData.messages || [];
    
    const newMessage = {
      ...message,
      timestamp: Timestamp.now()
    };
    
    await updateDoc(chatRef, {
      messages: [...currentMessages, newMessage],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding message to chat:', error);
    throw new Error('Failed to add message to chat');
  }
}

// Get recent messages from a chat for context
export async function getChatContext(userId: string, chatId: string, messageLimit: number = 10): Promise<ChatMessage[]> {
  try {
    const chat = await getChat(userId, chatId);
    if (!chat) return [];
    
    // Return the last N messages for context
    return chat.messages.slice(-messageLimit);
  } catch (error) {
    console.error('Error getting chat context:', error);
    return [];
  }
}

// Get all chats for a user (for sidebar)
export async function getUserChats(userId: string): Promise<Pick<Chat, 'id' | 'title' | 'updatedAt'>[]> {
  try {
    const chatsRef = collection(db, 'users', userId, 'chats');
    const q = query(chatsRef, orderBy('updatedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    });
  } catch (error) {
    console.error('Error getting user chats:', error);
    throw new Error('Failed to get user chats');
  }
}
