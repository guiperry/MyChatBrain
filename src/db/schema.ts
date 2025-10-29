export interface Users {
  id?: number;
  username: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id?: number;
  user_id: number;
  key: string;
  value?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSessions {
  id?: number;
  user_id?: number | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessages {
  id?: number;
  session_id: number;
  content: string;
  role: 'user' | 'bot';
  timestamp: string;
}

export interface Prompts {
  id?: number;
  user_id?: number | null;
  content: string;
  title?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notes {
  id?: number;
  user_id?: number | null;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryNodes {
  id?: number;
  user_id?: number | null;
  label: string;
  type: 'keyword' | 'entity' | 'message' | 'topic' | 'custom';
  metadata?: string; // JSON string containing additional data
  created_at: string;
  updated_at: string;
}

export interface MemoryEdges {
  id?: number;
  source_id: number; // References MemoryNodes.id
  target_id: number; // References MemoryNodes.id
  relation: 'related_to' | 'mentioned_in' | 'part_of' | 'temporal' | 'custom';
  weight: number; // Strength of the relationship (1-10)
  metadata?: string; // JSON string containing additional data
  created_at: string;
  updated_at: string;
}

export const TABLES = {
  USERS: 'users',
  SETTINGS: 'settings',
  CHAT_SESSIONS: 'chat_sessions',
  CHAT_MESSAGES: 'chat_messages',
  PROMPTS: 'prompts',
  NOTES: 'notes',
  MEMORY_NODES: 'memory_nodes',
  MEMORY_EDGES: 'memory_edges'
} as const;

// Export types with original Drizzle-style names for compatibility
export type users = Users;
export type settings = Settings;
export type chatSessions = ChatSessions;
export type chatMessages = ChatMessages;
export type prompts = Prompts;
export type notes = Notes;
export type memoryNodes = MemoryNodes;
export type memoryEdges = MemoryEdges;