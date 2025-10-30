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

// Persona Mapping Tables
export interface PersonaUsers {
  id?: number;
  user_id: number; // References users.id
  platform_ids?: string; // JSON array of platform IDs
  created_at: string;
  updated_at: string;
}

export interface PersonaSessions {
  id?: number;
  user_id: number; // References users.id
  session_id?: number; // References chat_sessions.id
  started_at: string;
  channel: string; // e.g., 'web', 'api', 'slack'
  context?: string; // JSON string with session context
  created_at: string;
  updated_at: string;
}

export interface PersonaMessages {
  id?: number;
  session_id: number; // References persona_sessions.id
  message_id?: number; // References chat_messages.id
  turn_index: number;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface SentimentMetrics {
  id?: number;
  message_id: number; // References persona_messages.id
  polarity: number; // -1 to 1
  score: number; // confidence score 0-1
  model_version: string;
  created_at: string;
}

export interface InterestMetrics {
  id?: number;
  user_id: number; // References users.id
  topic: string;
  weight: number; // interest strength 0-1
  decay_factor: number; // decay rate
  last_updated: string;
  created_at: string;
}

export interface GoalMetrics {
  id?: number;
  user_id: number; // References users.id
  description: string;
  status: 'active' | 'completed' | 'cancelled';
  confidence: number; // 0-1
  created_at: string;
  updated_at: string;
}

export interface PersonalityTraits {
  id?: number;
  user_id: number; // References users.id
  trait_label: string; // e.g., 'openness', 'conscientiousness'
  percentile: number; // 0-100
  evidence_count: number;
  last_updated: string;
  created_at: string;
}

export interface ErrorEvents {
  id?: number;
  session_id: number; // References persona_sessions.id
  type: string; // error category
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution_state: 'open' | 'resolved' | 'ignored';
  details?: string; // JSON string with error details
  created_at: string;
}

export interface ToolUsages {
  id?: number;
  session_id: number; // References persona_sessions.id
  tool_name: string;
  success: boolean;
  latency_ms: number;
  parameters?: string; // JSON string of tool parameters
  created_at: string;
}

export interface IdeaNodes {
  id?: number;
  user_id: number; // References users.id
  title: string;
  tags?: string; // JSON array of tags
  status: 'draft' | 'refined' | 'implemented';
  content?: string;
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
  MEMORY_EDGES: 'memory_edges',
  // Persona Mapping Tables
  PERSONA_USERS: 'persona_users',
  PERSONA_SESSIONS: 'persona_sessions',
  PERSONA_MESSAGES: 'persona_messages',
  SENTIMENT_METRICS: 'sentiment_metrics',
  INTEREST_METRICS: 'interest_metrics',
  GOAL_METRICS: 'goal_metrics',
  PERSONALITY_TRAITS: 'personality_traits',
  ERROR_EVENTS: 'error_events',
  TOOL_USAGES: 'tool_usages',
  IDEA_NODES: 'idea_nodes'
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
