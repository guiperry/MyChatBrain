import { createDb, type Document, type Query, type UpdateOperation, type ICollection, type Adapter } from '@nebula-db/core';
import path from 'path';
import os from 'os';
import bcrypt from 'bcryptjs';

class InMemoryAdapter implements Adapter {
  private data: Record<string, Document[]> = {};
  async load() { return this.data; }
  async save(data: Record<string, Document[]>) { this.data = data; }
}

function getDataDirectory(): string {
  const platform = os.platform();
  const homeDir = os.homedir();
  switch (platform) {
    case 'win32': return path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'nebuladb-data');
    case 'darwin': return path.join(homeDir, 'Library', 'Application Support', 'nebuladb-data');
    default: return path.join(homeDir, '.local', 'share', 'nebuladb-data');
  }
}

let dbInstance: ReturnType<typeof createDb> | null = null;
let initInProgress = false;

export async function getDatabase(): Promise<ReturnType<typeof createDb>> {
  if (dbInstance) return dbInstance;
  if (initInProgress) {
    while (initInProgress) await new Promise(r => setTimeout(r, 10));
    if (dbInstance) return dbInstance;
  }
  initInProgress = true;
  try {
    dbInstance = createDb({ adapter: new InMemoryAdapter() });
    console.log('✓ NebulaDB initialized with InMemoryAdapter');
    return dbInstance;
  } finally { initInProgress = false; }
}

let collectionsReady = false;
const _collections: Record<string, ICollection> = {};

async function initCollections() {
  if (collectionsReady) return _collections;
  const db = await getDatabase();

  _collections.users = db.collection('users');
  _collections.chat_sessions = db.collection('chat_sessions');
  _collections.chat_messages = db.collection('chat_messages');
  _collections.settings = db.collection('settings');
  _collections.prompts = db.collection('prompts');
  _collections.notes = db.collection('notes');
  _collections.memory_nodes = db.collection('memory_nodes');
  _collections.memory_edges = db.collection('memory_edges');
  _collections.counters = db.collection('counters');
  _collections.tool_usages = db.collection('tool_usages');
  _collections.sentiment_metrics = db.collection('sentiment_metrics');
  _collections.personality_traits = db.collection('personality_traits');
  _collections.interest_metrics = db.collection('interest_metrics');
  _collections.goal_metrics = db.collection('goal_metrics');
  _collections.idea_nodes = db.collection('idea_nodes');
  _collections.error_events = db.collection('error_events');

  collectionsReady = true;
  return _collections;
}

export async function getCollections() {
  await initCollections();
  return _collections;
}

export async function insertBatch(collectionName: string, docs: Document[]) {
  const cols = await getCollections();
  const c = cols[collectionName];
  if (!c) throw new Error(`Collection ${collectionName} not found`);
  return c.insertBatch(docs);
}

export async function updateBatch(collectionName: string, updates: Array<{ query: Query; update: UpdateOperation }>) {
  const cols = await getCollections();
  const c = cols[collectionName];
  if (!c) throw new Error(`Collection ${collectionName} not found`);
  return c.updateBatch(updates.map(u => u.query), updates.map(u => u.update));
}

export async function deleteBatch(collectionName: string, queries: Query[]) {
  const cols = await getCollections();
  const c = cols[collectionName];
  if (!c) throw new Error(`Collection ${collectionName} not found`);
  return c.deleteBatch(queries);
}

export async function subscribeToQuery(collectionName: string, query: Query, callback: (docs: Document[]) => void) {
  const cols = await getCollections();
  const c = cols[collectionName];
  if (!c) throw new Error(`Collection ${collectionName} not found`);
  return c.subscribe(query, callback);
}

async function seedAdmin() {
  const cols = await getCollections();
  const existing = await cols.users.findOne({ username: 'admin' });
  if (!existing) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    await cols.users.insert({
      id: 'admin-' + Date.now(),
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✓ Admin user seeded');
  }
}

export async function initializeDatabase() {
  try {
    await getDatabase();
    await seedAdmin();
    console.log('✓ Database initialized successfully');
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
}

export const collections: any = new Proxy({} as Record<string, ICollection>, {
  get(_target, prop) {
    if (typeof prop === 'symbol') return undefined;
    return {
      insert: async (doc: Document) => (await getCollections())[prop as string]?.insert(doc),
      find: (query?: Query) => ({
        sort: () => ({ toArray: async () => (await getCollections())[prop as string]?.find(query) }),
        toArray: async () => (await getCollections())[prop as string]?.find(query)
      }),
      findOne: async (query: Query) => (await getCollections())[prop as string]?.findOne(query),
      update: async (query: Query, update: UpdateOperation) => (await getCollections())[prop as string]?.update(query, update),
      delete: async (query: Query) => (await getCollections())[prop as string]?.delete(query),
      deleteMany: async (query: Query) => (await getCollections())[prop as string]?.delete(query)
    };
  }
});

export const db: any = new Proxy({}, {
  get(_target, prop) {
    if (typeof prop === 'symbol') return undefined;
    return async (...args: any[]) => {
      if (!dbInstance) await getDatabase();
      if (dbInstance) return (dbInstance as any)[prop](...args);
      throw new Error(`Database not available for method ${String(prop)}`);
    };
  }
});

export default getDatabase;