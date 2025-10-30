import {
  toTypedRxJsonSchema,
  ExtractDocumentTypeFromTypedRxJsonSchema,
  RxJsonSchema,
  RxCollection,
  RxDocument,
  RxDatabase
} from 'rxdb';

// User collection schema
export const userSchemaLiteral = {
  title: 'user schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string'
    },
    username: {
      type: 'string'
    },
    email: {
      type: 'string'
    },
    password: {
      type: 'string'
    },
    created_at: {
      type: 'string'
    },
    updated_at: {
      type: 'string'
    }
  },
  required: ['id', 'username', 'email', 'password', 'created_at', 'updated_at']
} as const;

const schemaTyped = toTypedRxJsonSchema(userSchemaLiteral);
export type UserDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;
export const userSchema: RxJsonSchema<UserDocType> = userSchemaLiteral;

// Settings collection schema
export const settingsSchemaLiteral = {
  title: 'settings schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'number',
      minimum: 1
    },
    user_id: {
      type: 'number',
      minimum: 1
    },
    key: {
      type: 'string',
      maxLength: 255
    },
    value: {
      type: 'string'
    },
    created_at: {
      type: 'string',
      format: 'date-time'
    },
    updated_at: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['id', 'user_id', 'key', 'created_at', 'updated_at'],
  indexes: ['user_id', 'key']
} as const;

const settingsSchemaTyped = toTypedRxJsonSchema(settingsSchemaLiteral);
export type SettingsDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof settingsSchemaTyped>;
export const settingsSchema: RxJsonSchema<SettingsDocType> = settingsSchemaLiteral;

// Chat Sessions collection schema
export const chatSessionsSchemaLiteral = {
  title: 'chat sessions schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'number',
      minimum: 1
    },
    user_id: {
      type: ['number', 'null']
    },
    title: {
      type: 'string',
      maxLength: 255
    },
    created_at: {
      type: 'string',
      format: 'date-time'
    },
    updated_at: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['id', 'title', 'created_at', 'updated_at'],
  indexes: ['user_id', 'created_at']
} as const;

const chatSessionsSchemaTyped = toTypedRxJsonSchema(chatSessionsSchemaLiteral);
export type ChatSessionDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof chatSessionsSchemaTyped>;
export const chatSessionsSchema: RxJsonSchema<ChatSessionDocType> = chatSessionsSchemaLiteral;

// Chat Messages collection schema
export const chatMessagesSchemaLiteral = {
  title: 'chat messages schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'number',
      minimum: 1
    },
    session_id: {
      type: 'number',
      minimum: 1
    },
    content: {
      type: 'string'
    },
    role: {
      type: 'string',
      enum: ['user', 'bot']
    },
    timestamp: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['id', 'session_id', 'content', 'role', 'timestamp'],
  indexes: ['session_id', 'timestamp']
} as const;

const chatMessagesSchemaTyped = toTypedRxJsonSchema(chatMessagesSchemaLiteral);
export type ChatMessageDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof chatMessagesSchemaTyped>;
export const chatMessagesSchema: RxJsonSchema<ChatMessageDocType> = chatMessagesSchemaLiteral;

// Prompts collection schema
export const promptsSchemaLiteral = {
  title: 'prompts schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'number',
      minimum: 1
    },
    user_id: {
      type: ['number', 'null']
    },
    content: {
      type: 'string'
    },
    title: {
      type: ['string', 'null'],
      maxLength: 255
    },
    created_at: {
      type: 'string',
      format: 'date-time'
    },
    updated_at: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['id', 'content', 'created_at', 'updated_at'],
  indexes: ['user_id', 'created_at']
} as const;

const promptsSchemaTyped = toTypedRxJsonSchema(promptsSchemaLiteral);
export type PromptDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof promptsSchemaTyped>;
export const promptsSchema: RxJsonSchema<PromptDocType> = promptsSchemaLiteral;

// Notes collection schema
export const notesSchemaLiteral = {
  title: 'notes schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'number',
      minimum: 1
    },
    user_id: {
      type: ['number', 'null']
    },
    title: {
      type: 'string',
      maxLength: 255
    },
    content: {
      type: 'string'
    },
    created_at: {
      type: 'string',
      format: 'date-time'
    },
    updated_at: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['id', 'title', 'content', 'created_at', 'updated_at'],
  indexes: ['user_id', 'created_at']
} as const;

const notesSchemaTyped = toTypedRxJsonSchema(notesSchemaLiteral);
export type NoteDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof notesSchemaTyped>;
export const notesSchema: RxJsonSchema<NoteDocType> = notesSchemaLiteral;

// Memory Nodes collection schema
export const memoryNodesSchemaLiteral = {
  title: 'memory nodes schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'number',
      minimum: 1
    },
    user_id: {
      type: ['number', 'null']
    },
    label: {
      type: 'string',
      maxLength: 255
    },
    type: {
      type: 'string',
      enum: ['keyword', 'entity', 'message', 'topic', 'custom']
    },
    metadata: {
      type: 'string'
    },
    created_at: {
      type: 'string',
      format: 'date-time'
    },
    updated_at: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['id', 'label', 'type', 'created_at', 'updated_at'],
  indexes: ['user_id', 'type', 'created_at']
} as const;

const memoryNodesSchemaTyped = toTypedRxJsonSchema(memoryNodesSchemaLiteral);
export type MemoryNodeDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof memoryNodesSchemaTyped>;
export const memoryNodesSchema: RxJsonSchema<MemoryNodeDocType> = memoryNodesSchemaLiteral;

// Memory Edges collection schema
export const memoryEdgesSchemaLiteral = {
  title: 'memory edges schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'number',
      minimum: 1
    },
    source_id: {
      type: 'number',
      minimum: 1
    },
    target_id: {
      type: 'number',
      minimum: 1
    },
    relation: {
      type: 'string',
      enum: ['related_to', 'mentioned_in', 'part_of', 'temporal', 'custom']
    },
    weight: {
      type: 'number',
      minimum: 1,
      maximum: 10
    },
    metadata: {
      type: 'string'
    },
    created_at: {
      type: 'string',
      format: 'date-time'
    },
    updated_at: {
      type: 'string',
      format: 'date-time'
    }
  },
  required: ['id', 'source_id', 'target_id', 'relation', 'weight', 'created_at', 'updated_at'],
  indexes: ['source_id', 'target_id', 'relation']
} as const;

const memoryEdgesSchemaTyped = toTypedRxJsonSchema(memoryEdgesSchemaLiteral);
export type MemoryEdgeDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof memoryEdgesSchemaTyped>;
export const memoryEdgesSchema: RxJsonSchema<MemoryEdgeDocType> = memoryEdgesSchemaLiteral;

// Collection declarations
export type MyDatabaseCollections = {
  users: RxCollection<UserDocType>;
  settings: RxCollection<SettingsDocType>;
  chat_sessions: RxCollection<ChatSessionDocType>;
  chat_messages: RxCollection<ChatMessageDocType>;
  prompts: RxCollection<PromptDocType>;
  notes: RxCollection<NoteDocType>;
  memory_nodes: RxCollection<MemoryNodeDocType>;
  memory_edges: RxCollection<MemoryEdgeDocType>;
};

export type MyDatabase = RxDatabase<MyDatabaseCollections>;
