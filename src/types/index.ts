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

// Persona-related types (matching database schema)
export interface PersonaUser {
  id: number;
  user_id: number;
  platform_ids: string;
  created_at: string;
  updated_at: string;
}

export interface PersonaSession {
  id: number;
  user_id: number;
  session_id: number | null;
  started_at: string;
  channel: string;
  context: string;
  created_at: string;
  updated_at: string;
}

export interface PersonaMessage {
  id: number;
  session_id: number;
  message_id: number | null;
  turn_index: number;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface SentimentMetric {
  id: number;
  message_id: number;
  polarity: number;
  score: number;
  model_version: string;
  created_at: string;
}

export interface InterestMetric {
  id: number;
  user_id: number;
  topic: string;
  weight: number;
  decay_factor: number;
  last_updated: string;
  created_at: string;
}

export interface GoalMetric {
  id: number;
  user_id: number;
  description: string;
  status: 'active' | 'completed' | 'cancelled';
  confidence: number;
  created_at: string;
  updated_at: string;
}

export interface PersonalityTrait {
  id: number;
  user_id: number;
  trait_label: string;
  percentile: number;
  evidence_count: number;
  last_updated: string;
  created_at: string;
}

export interface ErrorEvent {
  id: number;
  session_id: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution_state: 'open' | 'resolved' | 'ignored';
  details: string;
  created_at: string;
}

export interface ToolUsage {
  id: number;
  session_id: number;
  tool_name: string;
  success: boolean;
  latency_ms: number;
  parameters: string;
  created_at: string;
}

export interface IdeaNode {
  id: number;
  user_id: number;
  title: string;
  tags: string;
  status: 'draft' | 'refined' | 'implemented';
  content: string;
  created_at: string;
  updated_at: string;
}

// Persona snapshot for API responses
export interface PersonaSnapshot {
  userId: number;
  sentiment: {
    averagePolarity: number;
    totalMessages: number;
    recentTrend: number[];
  };
  interests: InterestMetric[];
  goals: GoalMetric[];
  personality: PersonalityTrait[];
  errors: ErrorEvent[];
  toolUsage: ToolUsage[];
  activity: {
    totalSessions: number;
    totalMessages: number;
    lastActivity: string;
  };
}

// Input types for persona operations
export type CreatePersonaUserInput = {
  user_id: number;
  platform_ids?: string;
};

export type CreatePersonaSessionInput = {
  user_id: number;
  session_id?: number | null;
  channel: string;
  context?: string;
};

export type CreatePersonaMessageInput = {
  session_id: number;
  message_id?: number | null;
  turn_index: number;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
};

export type CreateSentimentMetricInput = {
  message_id: number;
  polarity: number;
  score: number;
  model_version: string;
};

export type CreateInterestMetricInput = {
  user_id: number;
  topic: string;
  weight: number;
  decay_factor: number;
};

export type CreateGoalMetricInput = {
  user_id: number;
  description: string;
  status: 'active' | 'completed' | 'cancelled';
  confidence: number;
};

export type CreatePersonalityTraitInput = {
  user_id: number;
  trait_label: string;
  percentile: number;
  evidence_count: number;
};

export type CreateErrorEventInput = {
  session_id: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution_state: 'open' | 'resolved' | 'ignored';
  details?: string;
};

export type CreateToolUsageInput = {
  session_id: number;
  tool_name: string;
  success: boolean;
  latency_ms: number;
  parameters?: string;
};

export type CreateIdeaNodeInput = {
  user_id: number;
  title: string;
  tags?: string;
  status: 'draft' | 'refined' | 'implemented';
  content?: string;
};
