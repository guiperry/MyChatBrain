import { collections } from './nebuladb';

// Type assertion to access methods that might not be in the type definitions
let typedCollections: any = null;

async function getTypedCollections() {
  if (!typedCollections) {
    typedCollections = collections;
  }
  return typedCollections;
}

export class NebulaDBHelper {
  // Users collection operations
  async getUser(id: number) {
    const cols = await getTypedCollections();
    return await cols.users.findOne({ id });
  }

  async getUserByUsername(username: string) {
    const cols = await getTypedCollections();
    return await cols.users.findOne({ username });
  }

  async getUserByEmail(email: string) {
    const cols = await getTypedCollections();
    return await cols.users.findOne({ email });
  }

  async createUser(userData: { username: string; email: string; password: string }) {
    const cols = await getTypedCollections();
    const now = new Date().toISOString();
    const nextId = await this.getNextId('users');

    return await cols.users.insert({
      id: nextId.toString(),
      username: userData.username,
      email: userData.email,
      password: userData.password,
      createdAt: now,
      updatedAt: now
    });
  }

  async updateUser(id: string, updates: Partial<{ username: string; email: string; password: string }>) {
    const cols = await getTypedCollections();
    const user = await cols.users.findOne({ id });
    if (!user) throw new Error('User not found');

    const updateData = { ...updates, updatedAt: new Date().toISOString() };
    return await cols.users.update({ id }, { $set: updateData });
  }

  // Settings collection operations
  async getSettings(userId: number) {
    const cols = await getTypedCollections();
    return await (cols.settings as any).find({ user_id: userId }).toArray();
  }

  async getSetting(userId: number, key: string) {
    const cols = await getTypedCollections();
    return await cols.settings.findOne({ user_id: userId, key });
  }

  async setSetting(userId: number, key: string, value: string) {
    const cols = await getTypedCollections();
    const existing = await this.getSetting(userId, key);
    const now = new Date().toISOString();

    if (existing) {
      return await cols.settings.update(
        { user_id: userId, key },
        { $set: { value, updated_at: now } }
      );
    } else {
      const nextId = await this.getNextId('settings');
      return await cols.settings.insert({
        id: nextId.toString(),
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
    const cols = await getTypedCollections();
    const query = userId ? { user_id: userId } : {};
    return await (cols.chat_sessions as any).find(query).sort({ created_at: -1 }).toArray();
  }

  async getChatSession(id: string | number) {
    const cols = await getTypedCollections();
    return await cols.chat_sessions.findOne({ id: id.toString() });
  }

  async createChatSession(sessionData: { title: string; user_id?: number | null }) {
    const cols = await getTypedCollections();
    const now = new Date().toISOString();
    const nextId = await this.getNextId('chat_sessions');
    const idStr = nextId.toString();

    return await cols.chat_sessions.insert({
      id: idStr,
      title: sessionData.title,
      user_id: sessionData.user_id || null,
      created_at: now,
      updated_at: now
    });
  }

  async updateChatSession(id: string | number, updates: Partial<{ title: string; user_id?: number | null }>) {
    const cols = await getTypedCollections();
    const session = await cols.chat_sessions.findOne({ id: id.toString() });
    if (!session) throw new Error('Chat session not found');

    const updateData = { ...updates, updated_at: new Date().toISOString() };
    return await cols.chat_sessions.update({ id: id.toString() }, { $set: updateData });
  }

  async deleteChatSession(id: string | number) {
    const cols = await getTypedCollections();
    const idStr = id.toString();
    const session = await cols.chat_sessions.findOne({ id: idStr });

    if (session) {
      await (cols.chat_sessions as any).delete({ id: idStr });
      // Also delete all messages in this session
      await (cols.chat_messages as any).deleteMany({ session_id: idStr });
    }
  }

  // Chat messages operations
  async getChatMessages(sessionId: string | number) {
    const cols = await getTypedCollections();
    const sessionIdStr = sessionId.toString();
    return await (cols.chat_messages as any).find({ session_id: sessionIdStr }).sort({ timestamp: 1 }).toArray();
  }

  async addChatMessage(messageData: { session_id: string | number; content: string; role: 'user' | 'bot'; timestamp: string }) {
    const cols = await getTypedCollections();
    const nextId = await this.getNextId('chat_messages');
    const sessionIdStr = messageData.session_id.toString();
    return await cols.chat_messages.insert({
      _id: nextId.toString(),
      session_id: sessionIdStr,
      content: messageData.content,
      role: messageData.role,
      timestamp: messageData.timestamp
    });
  }

  async deleteChatMessages(sessionId: string | number) {
    const cols = await getTypedCollections();
    const sessionIdStr = sessionId.toString();
    return await (cols.chat_messages as any).deleteMany({ session_id: sessionIdStr });
  }

  // Notes operations
  async getNotes(userId?: number | null) {
    const cols = await getTypedCollections();
    const query = userId ? { user_id: userId } : {};
    return await (cols.notes as any).find(query).sort({ updated_at: -1 }).toArray();
  }

  async getNote(id: string | number) {
    const cols = await getTypedCollections();
    return await cols.notes.findOne({ _id: id.toString() });
  }

  async createNote(noteData: { title: string; content: string; user_id?: number | null }) {
    const cols = await getTypedCollections();
    const now = new Date().toISOString();
    const nextId = await this.getNextId('notes');

    return await cols.notes.insert({
      _id: nextId.toString(),
      title: noteData.title,
      content: noteData.content,
      user_id: noteData.user_id || null,
      created_at: now,
      updated_at: now
    });
  }

  async updateNote(id: number, updates: Partial<{ title: string; content: string; user_id?: number | null }>) {
    const cols = await getTypedCollections();
    const note = await cols.notes.findOne({ _id: id.toString() });
    if (!note) throw new Error('Note not found');

    const updateData = { ...updates, updated_at: new Date().toISOString() };
    return await cols.notes.update({ _id: id.toString() }, { $set: updateData });
  }

  async deleteNote(id: number) {
    const cols = await getTypedCollections();
    const note = await cols.notes.findOne({ _id: id.toString() });
    if (note) {
      await (cols.notes as any).delete({ _id: id.toString() });
    }
  }

  // Prompts operations
  async getPrompts(userId?: number | null) {
    const cols = await getTypedCollections();
    const query = userId ? { user_id: userId } : {};
    return await (cols.prompts as any).find(query).sort({ updated_at: -1 }).toArray();
  }

  async getPrompt(id: number) {
    const cols = await getTypedCollections();
    return await cols.prompts.findOne({ _id: id.toString() });
  }

  async createPrompt(promptData: { content: string; title?: string | null; user_id?: number | null }) {
    const cols = await getTypedCollections();
    const now = new Date().toISOString();
    const nextId = await this.getNextId('prompts');

    return await cols.prompts.insert({
      _id: nextId.toString(),
      content: promptData.content,
      title: promptData.title || null,
      user_id: promptData.user_id || null,
      created_at: now,
      updated_at: now
    });
  }

  async updatePrompt(id: number, updates: Partial<{ content: string; title?: string | null; user_id?: number | null }>) {
    const cols = await getTypedCollections();
    const prompt = await cols.prompts.findOne({ _id: id.toString() });
    if (!prompt) throw new Error('Prompt not found');

    const updateData = { ...updates, updated_at: new Date().toISOString() };
    return await cols.prompts.update({ _id: id.toString() }, { $set: updateData });
  }

  async deletePrompt(id: number) {
    const cols = await getTypedCollections();
    const prompt = await cols.prompts.findOne({ _id: id.toString() });
    if (prompt) {
      await (cols.prompts as any).delete({ _id: id.toString() });
    }
  }

  // Memory operations
  async getMemoryNodes(userId?: number | null) {
    const cols = await getTypedCollections();
    const query = userId ? { user_id: userId } : {};
    return await (cols.memory_nodes as any).find(query).sort({ created_at: -1 }).toArray();
  }

  async getMemoryNode(id: number) {
    const cols = await getTypedCollections();
    return await cols.memory_nodes.findOne({ _id: id.toString() });
  }

  async createMemoryNode(nodeData: { label: string; type: 'keyword' | 'entity' | 'message' | 'topic' | 'custom'; user_id?: number | null; metadata?: string }) {
    const cols = await getTypedCollections();
    const now = new Date().toISOString();
    const nextId = await this.getNextId('memory_nodes');

    return await cols.memory_nodes.insert({
      _id: nextId.toString(),
      label: nodeData.label,
      type: nodeData.type,
      user_id: nodeData.user_id || null,
      metadata: nodeData.metadata || '',
      created_at: now,
      updated_at: now
    });
  }

  async updateMemoryNode(id: number, updates: Partial<{ label: string; type: 'keyword' | 'entity' | 'message' | 'topic' | 'custom'; user_id?: number | null; metadata?: string }>) {
    const cols = await getTypedCollections();
    const node = await cols.memory_nodes.findOne({ _id: id.toString() });
    if (!node) throw new Error('Memory node not found');

    const updateData = { ...updates, updated_at: new Date().toISOString() };
    return await cols.memory_nodes.update({ _id: id.toString() }, { $set: updateData });
  }

  async deleteMemoryNode(id: number) {
    const cols = await getTypedCollections();
    const node = await cols.memory_nodes.findOne({ _id: id.toString() });
    if (node) {
      await (cols.memory_nodes as any).delete({ _id: id.toString() });
    }
  }

  async getMemoryEdges() {
    const cols = await getTypedCollections();
    return await (cols.memory_edges as any).find().toArray();
  }

  async findMemoryNode(label: string, type: 'keyword' | 'entity' | 'message' | 'topic' | 'custom', userId: number) {
    const cols = await getTypedCollections();
    return await (cols.memory_nodes as any).find({ label, type, user_id: userId }).toArray();
  }

  async findMemoryEdge(sourceId: number, targetId: number, relation: 'related_to' | 'mentioned_in' | 'part_of' | 'temporal' | 'custom') {
    const cols = await getTypedCollections();
    return await (cols.memory_edges as any).find({ source_id: sourceId, target_id: targetId, relation }).toArray();
  }

  async createMemoryEdge(edgeData: { source_id: number; target_id: number; relation: 'related_to' | 'mentioned_in' | 'part_of' | 'temporal' | 'custom'; weight: number; metadata?: string }) {
    const cols = await getTypedCollections();
    const now = new Date().toISOString();
    const nextId = await this.getNextId('memory_edges');

    return await cols.memory_edges.insert({
      _id: nextId.toString(),
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
  private async getNextId(collectionName: string): Promise<number> {
    const cols = await getTypedCollections();
    const collection = cols[collectionName];
    if (!collection) throw new Error(`Collection ${collectionName} not found`);

    // Find the maximum existing _id and increment
    const allDocs = await (collection as any).find({}).toArray();
    const maxId = allDocs.length > 0 ? Math.max(...allDocs.map((d: any) => parseInt(d._id) || 0)) : 0;
    return maxId + 1;
  }
}

// Global helper instance
let nebulaHelper: NebulaDBHelper | null = null;

export async function getNebulaDBHelper(): Promise<NebulaDBHelper> {
  if (!nebulaHelper) {
    nebulaHelper = new NebulaDBHelper();
  }
  return nebulaHelper;
}