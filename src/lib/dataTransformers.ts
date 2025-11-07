// Data transformation utilities for converting between database types and UI types
// Ensures type safety and consistency across the application

import {
  ChatMessage,
  ChatHistoryItem,
  ChatSession,
  ChatSessionDTO,
  ChatMessageDTO,
  User,
  Setting,
  Prompt,
  Note,
  MemoryNode,
  MemoryEdge,
  PersonaUser,
  PersonaSession,
  PersonaMessage,
  SentimentMetric,
  InterestMetric,
  GoalMetric,
  PersonalityTrait,
  ErrorEvent,
  ToolUsage,
  IdeaNode,
  PersonaSnapshot
} from '@/types';

/**
 * Transform ChatMessage to ChatHistoryItem for UI consumption
 */
export function chatMessageToHistoryItem(message: ChatMessage): ChatHistoryItem {
  return {
    text: message.content,
    type: message.role
  };
}

/**
 * Transform ChatHistoryItem to ChatMessage for database storage
 */
export function historyItemToChatMessage(
  item: ChatHistoryItem,
  sessionId: number,
  timestamp: string = new Date().toISOString()
): Omit<ChatMessage, 'id'> {
  return {
    session_id: sessionId,
    content: item.text,
    role: item.type,
    timestamp
  };
}

/**
 * Transform array of ChatMessages to ChatHistoryItems
 */
export function chatMessagesToHistoryItems(messages: ChatMessage[]): ChatHistoryItem[] {
  return messages.map(chatMessageToHistoryItem);
}

/**
 * Transform ChatSession to ChatSessionDTO for API responses
 */
export function chatSessionToDTO(session: ChatSession): ChatSessionDTO {
  const dto: ChatSessionDTO = {
    id: session.id,
    user_id: session.user_id,
    title: session.title,
    created_at: session.created_at,
    updated_at: session.updated_at
  };

  if (session.messages) {
    dto.messages = session.messages.map(chatMessageToDTO);
  }

  return dto;
}

/**
 * Transform ChatMessage to ChatMessageDTO for API responses
 */
export function chatMessageToDTO(message: ChatMessage): ChatMessageDTO {
  return {
    id: message.id,
    session_id: message.session_id,
    content: message.content,
    role: message.role,
    timestamp: message.timestamp
  };
}

/**
 * Transform array of ChatSessions to ChatSessionDTOs
 */
export function chatSessionsToDTOs(sessions: ChatSession[]): ChatSessionDTO[] {
  return sessions.map(chatSessionToDTO);
}

/**
 * Transform array of ChatMessages to ChatMessageDTOs
 */
export function chatMessagesToDTOs(messages: ChatMessage[]): ChatMessageDTO[] {
  return messages.map(chatMessageToDTO);
}

/**
 * Safe type guards for runtime validation
 */
export function isValidChatMessage(obj: any): obj is ChatMessage {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.session_id === 'number' &&
    typeof obj.content === 'string' &&
    (obj.role === 'user' || obj.role === 'bot') &&
    typeof obj.timestamp === 'string'
  );
}

export function isValidChatSession(obj: any): obj is ChatSession {
  return (
    obj &&
    typeof obj.id === 'number' &&
    (obj.user_id === null || typeof obj.user_id === 'number') &&
    typeof obj.title === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

export function isValidUser(obj: any): obj is User {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.username === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

export function isValidSetting(obj: any): obj is Setting {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.user_id === 'number' &&
    typeof obj.key === 'string' &&
    typeof obj.value === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

export function isValidPrompt(obj: any): obj is Prompt {
  return (
    obj &&
    typeof obj.id === 'number' &&
    (obj.user_id === null || typeof obj.user_id === 'number') &&
    typeof obj.content === 'string' &&
    (obj.title === null || typeof obj.title === 'string') &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

export function isValidNote(obj: any): obj is Note {
  return (
    obj &&
    typeof obj.id === 'number' &&
    (obj.user_id === null || typeof obj.user_id === 'number') &&
    typeof obj.title === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

export function isValidMemoryNode(obj: any): obj is MemoryNode {
  return (
    obj &&
    typeof obj.id === 'number' &&
    (obj.user_id === null || typeof obj.user_id === 'number') &&
    typeof obj.label === 'string' &&
    ['keyword', 'entity', 'message', 'topic', 'custom'].includes(obj.type) &&
    typeof obj.metadata === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

export function isValidMemoryEdge(obj: any): obj is MemoryEdge {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.source_id === 'number' &&
    typeof obj.target_id === 'number' &&
    ['related_to', 'mentioned_in', 'part_of', 'temporal', 'custom'].includes(obj.relation) &&
    typeof obj.weight === 'number' &&
    obj.weight >= 1 && obj.weight <= 10 &&
    typeof obj.metadata === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

// Persona type guards
export function isValidPersonaUser(obj: any): obj is PersonaUser {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.user_id === 'number' &&
    typeof obj.platform_ids === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

export function isValidPersonaSession(obj: any): obj is PersonaSession {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.user_id === 'number' &&
    (obj.session_id === null || typeof obj.session_id === 'number') &&
    typeof obj.started_at === 'string' &&
    typeof obj.channel === 'string' &&
    typeof obj.context === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

export function isValidPersonaMessage(obj: any): obj is PersonaMessage {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.session_id === 'number' &&
    (obj.message_id === null || typeof obj.message_id === 'number') &&
    typeof obj.turn_index === 'number' &&
    (obj.role === 'user' || obj.role === 'assistant') &&
    typeof obj.text === 'string' &&
    typeof obj.timestamp === 'string'
  );
}

export function isValidSentimentMetric(obj: any): obj is SentimentMetric {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.message_id === 'number' &&
    typeof obj.polarity === 'number' &&
    typeof obj.score === 'number' &&
    typeof obj.model_version === 'string' &&
    typeof obj.created_at === 'string'
  );
}

export function isValidInterestMetric(obj: any): obj is InterestMetric {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.user_id === 'number' &&
    typeof obj.topic === 'string' &&
    typeof obj.weight === 'number' &&
    typeof obj.decay_factor === 'number' &&
    typeof obj.last_updated === 'string' &&
    typeof obj.created_at === 'string'
  );
}

export function isValidGoalMetric(obj: any): obj is GoalMetric {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.user_id === 'number' &&
    typeof obj.description === 'string' &&
    ['active', 'completed', 'cancelled'].includes(obj.status) &&
    typeof obj.confidence === 'number' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

export function isValidPersonalityTrait(obj: any): obj is PersonalityTrait {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.user_id === 'number' &&
    typeof obj.trait_label === 'string' &&
    typeof obj.percentile === 'number' &&
    typeof obj.evidence_count === 'number' &&
    typeof obj.last_updated === 'string' &&
    typeof obj.created_at === 'string'
  );
}

export function isValidErrorEvent(obj: any): obj is ErrorEvent {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.session_id === 'number' &&
    typeof obj.type === 'string' &&
    ['low', 'medium', 'high', 'critical'].includes(obj.severity) &&
    ['open', 'resolved', 'ignored'].includes(obj.resolution_state) &&
    typeof obj.details === 'string' &&
    typeof obj.created_at === 'string'
  );
}

export function isValidToolUsage(obj: any): obj is ToolUsage {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.session_id === 'number' &&
    typeof obj.tool_name === 'string' &&
    typeof obj.success === 'boolean' &&
    typeof obj.latency_ms === 'number' &&
    typeof obj.parameters === 'string' &&
    typeof obj.created_at === 'string'
  );
}

export function isValidIdeaNode(obj: any): obj is IdeaNode {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.user_id === 'number' &&
    typeof obj.title === 'string' &&
    typeof obj.tags === 'string' &&
    ['draft', 'refined', 'implemented'].includes(obj.status) &&
    typeof obj.content === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}

// ChatHistoryItem validation for API input
export function isValidChatHistoryItem(obj: any): obj is ChatHistoryItem {
  return (
    obj &&
    typeof obj.text === 'string' &&
    (obj.type === 'user' || obj.type === 'bot')
  );
}

export function isValidChatHistoryItemsArray(obj: any): obj is ChatHistoryItem[] {
  return Array.isArray(obj) && obj.every(isValidChatHistoryItem);
}

/**
 * Error handling utilities for data transformation
 */
export class DataTransformationError extends Error {
  constructor(message: string, public originalData?: any) {
    super(message);
    this.name = 'DataTransformationError';
  }
}

/**
 * Safe transformation with error handling
 */
export function safeTransform<T>(
  data: any,
  transformer: (data: any) => T,
  errorMessage: string = 'Data transformation failed'
): T {
  try {
    return transformer(data);
  } catch (error) {
    throw new DataTransformationError(
      `${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      data
    );
  }
}
