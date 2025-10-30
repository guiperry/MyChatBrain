import { toTypedRxJsonSchema } from 'rxdb';
// User collection schema
export const userSchemaLiteral = {
    title: 'user schema',
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'number',
            minimum: 1
        },
        username: {
            type: 'string',
            maxLength: 255
        },
        email: {
            type: 'string',
            format: 'email',
            maxLength: 255
        },
        password: {
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
    required: ['id', 'username', 'email', 'password', 'created_at', 'updated_at'],
    indexes: ['username', 'email']
};
const schemaTyped = toTypedRxJsonSchema(userSchemaLiteral);
export const userSchema = userSchemaLiteral;
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
};
const settingsSchemaTyped = toTypedRxJsonSchema(settingsSchemaLiteral);
export const settingsSchema = settingsSchemaLiteral;
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
};
const chatSessionsSchemaTyped = toTypedRxJsonSchema(chatSessionsSchemaLiteral);
export const chatSessionsSchema = chatSessionsSchemaLiteral;
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
};
const chatMessagesSchemaTyped = toTypedRxJsonSchema(chatMessagesSchemaLiteral);
export const chatMessagesSchema = chatMessagesSchemaLiteral;
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
};
const promptsSchemaTyped = toTypedRxJsonSchema(promptsSchemaLiteral);
export const promptsSchema = promptsSchemaLiteral;
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
};
const notesSchemaTyped = toTypedRxJsonSchema(notesSchemaLiteral);
export const notesSchema = notesSchemaLiteral;
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
};
const memoryNodesSchemaTyped = toTypedRxJsonSchema(memoryNodesSchemaLiteral);
export const memoryNodesSchema = memoryNodesSchemaLiteral;
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
};
const memoryEdgesSchemaTyped = toTypedRxJsonSchema(memoryEdgesSchemaLiteral);
export const memoryEdgesSchema = memoryEdgesSchemaLiteral;
