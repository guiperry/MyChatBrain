import { createRxDatabase } from 'rxdb';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { userSchema, settingsSchema, chatSessionsSchema, chatMessagesSchema, promptsSchema, notesSchema, memoryNodesSchema, memoryEdgesSchema } from './rxdb-schema';
let dbPromise = null;
export async function getRxDB() {
    if (!dbPromise) {
        dbPromise = createRxDatabase({
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
    constructor(db) {
        this.db = db;
    }
    // Users collection operations
    async getUser(id) {
        return this.db.users.findOne(id.toString()).exec();
    }
    async getUserByUsername(username) {
        return this.db.users.findOne({
            selector: { username }
        }).exec();
    }
    async getUserByEmail(email) {
        return this.db.users.findOne({
            selector: { email }
        }).exec();
    }
    async createUser(userData) {
        const now = new Date().toISOString();
        const nextId = await this.getNextId('users');
        return this.db.users.insert({
            id: nextId,
            username: userData.username,
            email: userData.email,
            password: userData.password,
            created_at: now,
            updated_at: now
        });
    }
    async updateUser(id, updates) {
        const user = await this.db.users.findOne(id.toString()).exec();
        if (!user)
            throw new Error('User not found');
        return user.patch({
            ...updates,
            updated_at: new Date().toISOString()
        });
    }
    // Settings collection operations
    async getSettings(userId) {
        return this.db.settings.find({
            selector: { user_id: userId }
        }).exec();
    }
    async getSetting(userId, key) {
        return this.db.settings.findOne({
            selector: { user_id: userId, key }
        }).exec();
    }
    async setSetting(userId, key, value) {
        const existing = await this.getSetting(userId, key);
        const now = new Date().toISOString();
        if (existing) {
            return existing.patch({
                value,
                updated_at: now
            });
        }
        else {
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
    async getChatSessions(userId) {
        const selector = userId ? { user_id: userId } : {};
        return this.db.chat_sessions.find({
            selector,
            sort: [{ created_at: 'desc' }]
        }).exec();
    }
    async getChatSession(id) {
        return this.db.chat_sessions.findOne(id.toString()).exec();
    }
    async createChatSession(sessionData) {
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
    async updateChatSession(id, updates) {
        const session = await this.db.chat_sessions.findOne(id.toString()).exec();
        if (!session)
            throw new Error('Chat session not found');
        return session.patch({
            ...updates,
            updated_at: new Date().toISOString()
        });
    }
    async deleteChatSession(id) {
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
    async getChatMessages(sessionId) {
        return this.db.chat_messages.find({
            selector: { session_id: sessionId },
            sort: [{ timestamp: 'asc' }]
        }).exec();
    }
    async addChatMessage(messageData) {
        const nextId = await this.getNextId('chat_messages');
        return this.db.chat_messages.insert({
            id: nextId,
            session_id: messageData.session_id,
            content: messageData.content,
            role: messageData.role,
            timestamp: messageData.timestamp
        });
    }
    async deleteChatMessages(sessionId) {
        return this.db.chat_messages.find({
            selector: { session_id: sessionId }
        }).remove();
    }
    // Notes operations
    async getNotes(userId) {
        const selector = userId ? { user_id: userId } : {};
        return this.db.notes.find({
            selector,
            sort: [{ updated_at: 'desc' }]
        }).exec();
    }
    async getNote(id) {
        return this.db.notes.findOne(id.toString()).exec();
    }
    async createNote(noteData) {
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
    async updateNote(id, updates) {
        const note = await this.db.notes.findOne(id.toString()).exec();
        if (!note)
            throw new Error('Note not found');
        return note.patch({
            ...updates,
            updated_at: new Date().toISOString()
        });
    }
    async deleteNote(id) {
        const note = await this.db.notes.findOne(id.toString()).exec();
        if (note) {
            await note.remove();
        }
    }
    // Prompts operations
    async getPrompts(userId) {
        const selector = userId ? { user_id: userId } : {};
        return this.db.prompts.find({
            selector,
            sort: [{ updated_at: 'desc' }]
        }).exec();
    }
    async getPrompt(id) {
        return this.db.prompts.findOne(id.toString()).exec();
    }
    async createPrompt(promptData) {
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
    async updatePrompt(id, updates) {
        const prompt = await this.db.prompts.findOne(id.toString()).exec();
        if (!prompt)
            throw new Error('Prompt not found');
        return prompt.patch({
            ...updates,
            updated_at: new Date().toISOString()
        });
    }
    async deletePrompt(id) {
        const prompt = await this.db.prompts.findOne(id.toString()).exec();
        if (prompt) {
            await prompt.remove();
        }
    }
    // Memory operations
    async getMemoryNodes(userId) {
        const selector = userId ? { user_id: userId } : {};
        return this.db.memory_nodes.find({
            selector,
            sort: [{ created_at: 'desc' }]
        }).exec();
    }
    async getMemoryNode(id) {
        return this.db.memory_nodes.findOne(id.toString()).exec();
    }
    async createMemoryNode(nodeData) {
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
    async getMemoryEdges() {
        return this.db.memory_edges.find().exec();
    }
    async createMemoryEdge(edgeData) {
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
    async getNextId(collectionName) {
        const collection = this.db[collectionName];
        const docs = await collection.find().exec();
        const maxId = docs.reduce((max, doc) => Math.max(max, doc.id), 0);
        return maxId + 1;
    }
}
// Global helper instance
let rxdbHelper = null;
export async function getRxDBHelper() {
    if (!rxdbHelper) {
        const db = await getRxDB();
        rxdbHelper = new RxDBHelper(db);
    }
    return rxdbHelper;
}
