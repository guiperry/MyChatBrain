// Database-first type definitions - single source of truth
// These types match the database schema exactly (snake_case)

// User type (without sensitive data)
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// Database User type (includes password)
export interface DbUser extends User {
  password: string;
}

// Chat session type
export interface ChatSession {
  id: number;
  user_id: number | null;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[]; // Optional for when messages are included
}

// Chat message type
export interface ChatMessage {
  id: number;
  session_id: number;
  content: string;
  role: 'user' | 'bot';
  timestamp: string;
}

// Settings type
export interface Setting {
  id: number;
  user_id: number;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

// Prompts type
export interface Prompt {
  id: number;
  user_id: number | null;
  content: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

// Notes type
export interface Note {
  id: number;
  user_id: number | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Memory Nodes type
export interface MemoryNode {
  id: number;
  user_id: number | null;
  label: string;
  type: 'keyword' | 'entity' | 'message' | 'topic' | 'custom';
  metadata: string;
  created_at: string;
  updated_at: string;
}

// Memory Edges type
export interface MemoryEdge {
  id: number;
  source_id: number;
  target_id: number;
  relation: 'related_to' | 'mentioned_in' | 'part_of' | 'temporal' | 'custom';
  weight: number;
  metadata: string;
  created_at: string;
  updated_at: string;
}

// Decoded JWT token type
export interface DecodedToken {
  userId: number;
  iat: number;
  exp: number;
}

// Chat message for the UI (transformed from ChatMessage)
export interface ChatHistoryItem {
  text: string;
  type: 'user' | 'bot';
}

// Data Transfer Objects for API responses
export interface ChatSessionDTO extends Omit<ChatSession, 'messages'> {
  messages?: ChatMessageDTO[];
}

export interface ChatMessageDTO extends ChatMessage {}

// Utility types for API operations
export type CreateChatSessionInput = {
  title: string;
  user_id?: number | null;
};

export type UpdateChatSessionInput = {
  title?: string;
  user_id?: number | null;
};

export type CreateChatMessageInput = {
  session_id: number;
  content: string;
  role: 'user' | 'bot';
  timestamp: string;
};

export type CreateUserInput = {
  username: string;
  email: string;
  password: string;
};

export type UpdateUserInput = {
  username?: string;
  email?: string;
  password?: string;
};

export type CreateSettingInput = {
  user_id: number;
  key: string;
  value: string;
};

export type UpdateSettingInput = {
  value?: string;
};

export type CreatePromptInput = {
  user_id?: number | null;
  content: string;
  title?: string | null;
};

export type UpdatePromptInput = {
  content?: string;
  title?: string | null;
  user_id?: number | null;
};

export type CreateNoteInput = {
  user_id?: number | null;
  title: string;
  content: string;
};

export type UpdateNoteInput = {
  title?: string;
  content?: string;
  user_id?: number | null;
};

export type CreateMemoryNodeInput = {
  user_id?: number | null;
  label: string;
  type: 'keyword' | 'entity' | 'message' | 'topic' | 'custom';
  metadata?: string;
};

export type UpdateMemoryNodeInput = {
  label?: string;
  type?: 'keyword' | 'entity' | 'message' | 'topic' | 'custom';
  user_id?: number | null;
  metadata?: string;
};

export type CreateMemoryEdgeInput = {
  source_id: number;
  target_id: number;
  relation: 'related_to' | 'mentioned_in' | 'part_of' | 'temporal' | 'custom';
  weight: number;
  metadata?: string;
};
