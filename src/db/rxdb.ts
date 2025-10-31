import { createRxDatabase } from 'rxdb';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { addRxPlugin } from 'rxdb';
import {
  MyDatabase,
  MyDatabaseCollections,
  userSchema,
  settingsSchema,
  chatSessionsSchema,
  chatMessagesSchema,
  promptsSchema,
  notesSchema,
  memoryNodesSchema,
  memoryEdgesSchema
} from './rxdb-schema';

// Add dev mode plugin only in development
if (process.env.NODE_ENV === 'development') {
  addRxPlugin(RxDBDevModePlugin);
}

let dbPromise: Promise<MyDatabase> | null = null;

export async function getRxDB(): Promise<MyDatabase> {
  if (!dbPromise) {
    dbPromise = createRxDatabase<MyDatabaseCollections>({
      name: 'my-chat-brain-db',
      storage: getRxStorageMemory(),
      multiInstance: true, // Allow multiple tabs/windows
      eventReduce: true, // Enable event reduction for better performance
    }).then(async (db) => {
      // Add collections
      await db.addCollections({
        users: {
          schema: userSchema
        },
        settings: {
          schema: settingsSchema
        },
        chat_sessions: {
          schema: chatSessionsSchema
        },
        chat_messages: {
          schema: chatMessagesSchema
        },
        prompts: {
          schema: promptsSchema
        },
        notes: {
          schema: notesSchema
        },
        memory_nodes: {
          schema: memoryNodesSchema
        },
        memory_edges: {
          schema: memoryEdgesSchema
        }
      });

      return db;
    });
  }

  return dbPromise;
}

// Helper functions for database operations
export class RxDBHelper {
  private db: MyDatabase;

  constructor(db: MyDatabase) {
    this.db = db;
  }

  // Users collection operations
  async getUser(id: string) {
    return this.db.users.findOne(id).exec();
  }

  async getUserByUsername(username: string) {
    return this.db.users.findOne({
      selector: { username }
    }).exec();
  }

  async getUserByEmail(email: string) {
    return this.db.users.findOne({
      selector: { email }
    }).exec();
  }

  async createUser(userData: { username: string; email: string; password: string }) {
    const now = new Date().toISOString();
    const nextId = await this.getNextId('users');

    return this.db.users.insert({
      id: nextId.toString(),
      username: userData.username,
      email: userData.email,
      password: userData.password,
      created_at: now,
      updated_at: now
    });
  }

  async updateUser(id: string, updates: Partial<{ username: string; email: string; password: string }>) {
    const user = await this.db.users.findOne(id).exec();
    if (!user) throw new Error('User not found');

    return user.patch({
      ...updates,
      updated_at: new Date().toISOString()
    });
  }

  // Settings collection operations
  async getSettings(userId: number) {
    return this.db.settings.find({
      selector: { user_id: userId }
    }).exec();
  }

  async getSetting(userId: number, key: string) {
    return this.db.settings.findOne({
      selector: { user_id: userId, key }
    }).exec();
  }

  async setSetting(userId: number, key: string, value: string) {
    const existing = await this.getSetting(userId, key);
    const now = new Date().toISOString();

    if (existing) {
      return existing.patch({
        value,
        updated_at: now
      });
    } else {
      const nextId = await this.getNextId('settings');
      return this.db.settings.insert({
        id: nextId,
        user_id: userId,
        key,
        value,
        created_at: now,
        updated_at: now
      });
    }
  }

  // Chat sessions operations
  async getChatSessions(userId?: number | null) {
    const selector = userId ? { user_id: userId } : {};
    return this.db.chat_sessions.find({
      selector,
      sort: [{ created_at: 'desc' }]
    }).exec();
  }

  async getChatSession(id: number) {
    return this.db.chat_sessions.findOne(id.toString()).exec();
  }

  async createChatSession(sessionData: { title: string; user_id?: number | null }) {
    const now = new Date().toISOString();
    const nextId = await this.getNextId('chat_sessions');

    return this.db.chat_sessions.insert({
      id: nextId,
      title: sessionData.title,
      user_id: sessionData.user_id || null,
      created_at: now,
      updated_at: now
    });
  }

  async updateChatSession(id: number, updates: Partial<{ title: string; user_id?: number | null }>) {
    const session = await this.db.chat_sessions.findOne(id.toString()).exec();
    if (!session) throw new Error('Chat session not found');

    return session.patch({
      ...updates,
      updated_at: new Date().toISOString()
    });
  }

  async deleteChatSession(id: number) {
    const session = await this.db.chat_sessions.findOne(id.toString()).exec();
    if (session) {
      await session.remove();
      // Also delete all messages in this session
      await this.db.chat_messages.find({
        selector: { session_id: id }
      }).remove();
    }
  }

  // Chat messages operations
  async getChatMessages(sessionId: number) {
    return this.db.chat_messages.find({
      selector: { session_id: sessionId },
      sort: [{ timestamp: 'asc' }]
    }).exec();
  }

  async addChatMessage(messageData: { session_id: number; content: string; role: 'user' | 'bot'; timestamp: string }) {
    const nextId = await this.getNextId('chat_messages');
    return this.db.chat_messages.insert({
      id: nextId,
      session_id: messageData.session_id,
      content: messageData.content,
      role: messageData.role,
      timestamp: messageData.timestamp
    });
  }

  async deleteChatMessages(sessionId: number) {
    return this.db.chat_messages.find({
      selector: { session_id: sessionId }
    }).remove();
  }

  // Notes operations
  async getNotes(userId?: number | null) {
    const selector = userId ? { user_id: userId } : {};
    return this.db.notes.find({
      selector,
      sort: [{ updated_at: 'desc' }]
    }).exec();
  }

  async getNote(id: number) {
    return this.db.notes.findOne(id.toString()).exec();
  }

  async createNote(noteData: { title: string; content: string; user_id?: number | null }) {
    const now = new Date().toISOString();
    const nextId = await this.getNextId('notes');

    return this.db.notes.insert({
      id: nextId,
      title: noteData.title,
      content: noteData.content,
      user_id: noteData.user_id || null,
      created_at: now,
      updated_at: now
    });
  }

  async updateNote(id: number, updates: Partial<{ title: string; content: string; user_id?: number | null }>) {
    const note = await this.db.notes.findOne(id.toString()).exec();
    if (!note) throw new Error('Note not found');

    return note.patch({
      ...updates,
      updated_at: new Date().toISOString()
    });
  }

  async deleteNote(id: number) {
    const note = await this.db.notes.findOne(id.toString()).exec();
    if (note) {
      await note.remove();
    }
  }

  // Prompts operations
  async getPrompts(userId?: number | null) {
    const selector = userId ? { user_id: userId } : {};
    return this.db.prompts.find({
      selector,
      sort: [{ updated_at: 'desc' }]
    }).exec();
  }

  async getPrompt(id: number) {
    return this.db.prompts.findOne(id.toString()).exec();
  }

  async createPrompt(promptData: { content: string; title?: string | null; user_id?: number | null }) {
    const now = new Date().toISOString();
    const nextId = await this.getNextId('prompts');

    return this.db.prompts.insert({
      id: nextId,
      content: promptData.content,
      title: promptData.title || null,
      user_id: promptData.user_id || null,
      created_at: now,
      updated_at: now
    });
  }

  async updatePrompt(id: number, updates: Partial<{ content: string; title?: string | null; user_id?: number | null }>) {
    const prompt = await this.db.prompts.findOne(id.toString()).exec();
    if (!prompt) throw new Error('Prompt not found');

    return prompt.patch({
      ...updates,
      updated_at: new Date().toISOString()
    });
  }

  async deletePrompt(id: number) {
    const prompt = await this.db.prompts.findOne(id.toString()).exec();
    if (prompt) {
      await prompt.remove();
    }
  }

  // Memory operations
  async getMemoryNodes(userId?: number | null) {
    const selector = userId ? { user_id: userId } : {};
    return this.db.memory_nodes.find({
      selector,
      sort: [{ created_at: 'desc' }]
    }).exec();
  }

  async getMemoryNode(id: number) {
    return this.db.memory_nodes.findOne(id.toString()).exec();
  }

  async createMemoryNode(nodeData: { label: string; type: 'keyword' | 'entity' | 'message' | 'topic' | 'custom'; user_id?: number | null; metadata?: string }) {
    const now = new Date().toISOString();
    const nextId = await this.getNextId('memory_nodes');

    return this.db.memory_nodes.insert({
      id: nextId,
      label: nodeData.label,
      type: nodeData.type,
      user_id: nodeData.user_id || null,
      metadata: nodeData.metadata || '',
      created_at: now,
      updated_at: now
    });
  }

  async updateMemoryNode(id: number, updates: Partial<{ label: string; type: 'keyword' | 'entity' | 'message' | 'topic' | 'custom'; user_id?: number | null; metadata?: string }>) {
    const node = await this.db.memory_nodes.findOne(id.toString()).exec();
    if (!node) throw new Error('Memory node not found');

    return node.patch({
      ...updates,
      updated_at: new Date().toISOString()
    });
  }

  async deleteMemoryNode(id: number) {
    const node = await this.db.memory_nodes.findOne(id.toString()).exec();
    if (node) {
      await node.remove();
    }
  }

  async getMemoryEdges() {
    return this.db.memory_edges.find().exec();
  }

  async createMemoryEdge(edgeData: { source_id: number; target_id: number; relation: 'related_to' | 'mentioned_in' | 'part_of' | 'temporal' | 'custom'; weight: number; metadata?: string }) {
    const now = new Date().toISOString();
    const nextId = await this.getNextId('memory_edges');

    return this.db.memory_edges.insert({
      id: nextId,
      source_id: edgeData.source_id,
      target_id: edgeData.target_id,
      relation: edgeData.relation,
      weight: edgeData.weight,
      metadata: edgeData.metadata || '',
      created_at: now,
      updated_at: now
    });
  }

  // Helper method to get next ID for a collection
  private async getNextId(collectionName: keyof MyDatabaseCollections): Promise<number> {
    const collection = this.db[collectionName];
    const docs = await collection.find().exec();
    const maxId = docs.reduce((max, doc) => Math.max(max, parseInt(doc.id.toString())), 0);
    return maxId + 1;
  }
}

// Global helper instance
let rxdbHelper: RxDBHelper | null = null;

export async function getRxDBHelper(): Promise<RxDBHelper> {
  if (!rxdbHelper) {
    const db = await getRxDB();
    rxdbHelper = new RxDBHelper(db);
  }
  return rxdbHelper;
}
