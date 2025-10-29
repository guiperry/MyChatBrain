// Common types used throughout the application

// Chat session type
export interface ChatSession {
  id: number;
  userId: number | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[]; // Optional for when messages are included
}

// This type represents what's actually returned from the database queries
// The field names match the schema definition in drizzle
export interface DbChatSession {
  id: number;
  userId: number | null; // This is camelCase in the schema definition
  title: string;
  createdAt: string;
  updatedAt: string;
}

// Chat message type
export interface ChatMessage {
  id: number;
  sessionId: number;
  content: string;
  role: 'user' | 'bot';
  timestamp: string;
}

// User type (without sensitive data)
export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// Database User type (includes password)
export interface DbUser extends User {
  password: string;
}

// Decoded JWT token type
export interface DecodedToken {
  userId: number;
  iat: number;
  exp: number;
}

// Chat message for the UI
export interface ChatHistoryItem {
  text: string;
  type: 'user' | 'bot';
}

// Settings type
export interface Setting {
  id: number;
  userId: number;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}