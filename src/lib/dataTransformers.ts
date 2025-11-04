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
  MemoryEdge
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
