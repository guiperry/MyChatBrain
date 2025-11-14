import { createDatabase } from '@nebula-db/nebula-db';
import path from 'path';
import os from 'os';
import type { Database, Collection } from '@nebula-db/nebula-db';

// Get platform-specific data directory
function getDataDirectory(): string {
  const platform = os.platform();
  const homeDir = os.homedir();

  switch (platform) {
    case 'win32':
      return path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), 'nebuladb-data');
    case 'darwin':
      return path.join(homeDir, 'Library', 'Application Support', 'nebuladb-data');
    default:
      return path.join(homeDir, '.local', 'share', 'nebuladb-data');
  }
}

// Lazy database initialization to avoid build-time issues
let _db: Database | null = null;
let isInitializing = false;

async function getDatabase(): Promise<Database> {
  if (_db) return _db;
  if (isInitializing) {
    // Wait for ongoing initialization
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    if (_db) return _db;
  }

  isInitializing = true;
  try {
    // Use InMemoryAdapter for development to avoid native module issues
    _db = createDatabase({
      storage: 'InMemoryAdapter',
      path: ':memory:',
      validation: true
    });
    console.log('✓ NebulaDB initialized with InMemoryAdapter');
    return _db;
  } finally {
    isInitializing = false;
  }
}

// Lazy collection initialization
let collectionsInitialized = false;
const _collections: Record<string, Collection<any>> = {};

async function initializeCollections() {
  if (collectionsInitialized) return _collections;

  const db = await getDatabase();

  // Users collection for authorization
  _collections.users = db.collection('users', {
    indexes: [
      { name: 'id_idx', fields: ['id'], type: 'unique' },
      { name: 'username_idx', fields: ['username'], type: 'unique' },
      { name: 'email_idx', fields: ['email'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' },
      { name: 'role_idx', fields: ['role'], type: 'single' }
    ]
  });

  // Chat sessions collection
  _collections.chat_sessions = db.collection('chat_sessions', {
    indexes: [
      { name: 'id_idx', fields: ['id'], type: 'unique' },
      { name: 'user_id_idx', fields: ['user_id'], type: 'single' },
      { name: 'created_at_idx', fields: ['created_at'], type: 'single' },
      { name: 'updated_at_idx', fields: ['updated_at'], type: 'single' }
    ]
  });

  // Chat messages collection
  _collections.chat_messages = db.collection('chat_messages', {
    indexes: [
      { name: 'id_idx', fields: ['id'], type: 'unique' },
      { name: 'session_id_idx', fields: ['session_id'], type: 'single' },
      { name: 'timestamp_idx', fields: ['timestamp'], type: 'single' }
    ]
  });

  // Settings collection
  _collections.settings = db.collection('settings', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'user_id_key_idx', fields: ['user_id', 'key'], type: 'unique' },
      { name: 'created_at_idx', fields: ['created_at'], type: 'single' },
      { name: 'updated_at_idx', fields: ['updated_at'], type: 'single' }
    ]
  });

  // Prompts collection
  _collections.prompts = db.collection('prompts', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'user_id_idx', fields: ['user_id'], type: 'single' },
      { name: 'created_at_idx', fields: ['created_at'], type: 'single' },
      { name: 'updated_at_idx', fields: ['updated_at'], type: 'single' }
    ]
  });

  // Notes collection
  _collections.notes = db.collection('notes', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'user_id_idx', fields: ['user_id'], type: 'single' },
      { name: 'created_at_idx', fields: ['created_at'], type: 'single' },
      { name: 'updated_at_idx', fields: ['updated_at'], type: 'single' }
    ]
  });

  // Memory nodes collection
  _collections.memory_nodes = db.collection('memory_nodes', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'user_id_idx', fields: ['user_id'], type: 'single' },
      { name: 'type_idx', fields: ['type'], type: 'single' },
      { name: 'created_at_idx', fields: ['created_at'], type: 'single' },
      { name: 'updated_at_idx', fields: ['updated_at'], type: 'single' }
    ]
  });

  // Memory edges collection
  _collections.memory_edges = db.collection('memory_edges', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'source_target_idx', fields: ['source_id', 'target_id'], type: 'single' },
      { name: 'relation_idx', fields: ['relation'], type: 'single' },
      { name: 'created_at_idx', fields: ['created_at'], type: 'single' }
    ]
  });

  // Counters collection for ID generation
  _collections.counters = db.collection('counters', {
    indexes: [
      { name: 'collection_idx', fields: ['collection'], type: 'unique' }
    ]
  });

  // HTMLObjectElement collection
  _collections.HTMLObjectElement = db.collection('HTMLObjectElement', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // react_server_dom_webpack_client collection
  _collections.react_server_dom_webpack_client = db.collection('react_server_dom_webpack_client', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // _2 collection
  _collections._2 = db.collection('_2', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // _3 collection
  _collections._3 = db.collection('_3', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // LOSS collection
  _collections.LOSS = db.collection('LOSS', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // next_server collection
  _collections.next_server = db.collection('next_server', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __db_rxdb collection
  _collections.__db_rxdb = db.collection('__db_rxdb', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __types collection
  _collections.__types = db.collection('__types', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __lib_dataTransformers collection
  _collections.__lib_dataTransformers = db.collection('__lib_dataTransformers', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __db collection
  _collections.__db = db.collection('__db', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __lib_auth collection
  _collections.__lib_auth = db.collection('__lib_auth', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // next_headers collection
  _collections.next_headers = db.collection('next_headers', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __lib_memoryVectors collection
  _collections.__lib_memoryVectors = db.collection('__lib_memoryVectors', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // next_auth collection
  _collections.next_auth = db.collection('next_auth', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __lib_authOptions collection
  _collections.__lib_authOptions = db.collection('__lib_authOptions', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __lib_memoryExtractor collection
  _collections.__lib_memoryExtractor = db.collection('__lib_memoryExtractor', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // rxdb collection
  _collections.rxdb = db.collection('rxdb', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // rxdb_plugins_storage_localstorage collection
  _collections.rxdb_plugins_storage_localstorage = db.collection('rxdb_plugins_storage_localstorage', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // rxdb_plugins_dev_mode collection
  _collections.rxdb_plugins_dev_mode = db.collection('rxdb_plugins_dev_mode', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // rxdb_plugins_validate_ajv collection
  _collections.rxdb_plugins_validate_ajv = db.collection('rxdb_plugins_validate_ajv', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __rxdb_schema collection
  _collections.__rxdb_schema = db.collection('__rxdb_schema', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // bcryptjs collection
  _collections.bcryptjs = db.collection('bcryptjs', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // jsonwebtoken collection
  _collections.jsonwebtoken = db.collection('jsonwebtoken', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // ___types collection
  _collections.___types = db.collection('___types', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // _pinecone_database_pinecone collection
  _collections._pinecone_database_pinecone = db.collection('_pinecone_database_pinecone', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __vectorstore collection
  _collections.__vectorstore = db.collection('__vectorstore', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __db_schema collection
  _collections.__db_schema = db.collection('__db_schema', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // error_events collection
  _collections.error_events = db.collection('error_events', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // goal_metrics collection
  _collections.goal_metrics = db.collection('goal_metrics', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // idea_nodes collection
  _collections.idea_nodes = db.collection('idea_nodes', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // interest_metrics collection
  _collections.interest_metrics = db.collection('interest_metrics', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __sentimentAnalyzer collection
  _collections.__sentimentAnalyzer = db.collection('__sentimentAnalyzer', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __interestProfiler collection
  _collections.__interestProfiler = db.collection('__interestProfiler', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __goalTracker collection
  _collections.__goalTracker = db.collection('__goalTracker', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __personalityModeler collection
  _collections.__personalityModeler = db.collection('__personalityModeler', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __errorMonitor collection
  _collections.__errorMonitor = db.collection('__errorMonitor', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __toolsManager collection
  _collections.__toolsManager = db.collection('__toolsManager', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // __ideaNotetaker collection
  _collections.__ideaNotetaker = db.collection('__ideaNotetaker', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // sentiment_metrics collection
  _collections.sentiment_metrics = db.collection('sentiment_metrics', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // tool_usages collection
  _collections.tool_usages = db.collection('tool_usages', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  // personality_traits collection
  _collections.personality_traits = db.collection('personality_traits', {
    indexes: [
      { name: 'id_idx', fields: ['_id'], type: 'unique' },
      { name: 'created_at_idx', fields: ['createdAt'], type: 'single' }
    ]
  });

  collectionsInitialized = true;
  return collections;
}



// Lazy collections getter
async function getCollections(): Promise<Record<string, Collection<any>>> {
  await initializeCollections();
  return _collections;
}

// Update batch operations to use lazy collections
async function insertBatch(collectionName: string, documents: any[]) {
  const cols = await getCollections();
  const collection = cols[collectionName];
  if (!collection) throw new Error(`Collection ${collectionName} not found`);

  const results = [];
  for (const doc of documents) {
    const result = await collection.insert(doc);
    results.push(result);
  }
  return results;
}

async function updateBatch(collectionName: string, updates: Array<{ query: any, update: any }>) {
  const cols = await getCollections();
  const collection = cols[collectionName];
  if (!collection) throw new Error(`Collection ${collectionName} not found`);

  const results = [];
  for (const { query, update } of updates) {
    const result = await collection.update(query, update);
    results.push(result);
  }
  return results;
}

async function deleteBatch(collectionName: string, queries: any[]) {
  const cols = await getCollections();
  const collection = cols[collectionName];
  if (!collection) throw new Error(`Collection ${collectionName} not found`);

  const results = [];
  for (const query of queries) {
    const result = await collection.delete(query);
    results.push(result);
  }
  return results;
}

// Update reactive query utilities
async function subscribeToQuery(collectionName: string, query: any, callback: (data: any) => void) {
  const cols = await getCollections();
  const collection = cols[collectionName];
  if (!collection) throw new Error(`Collection ${collectionName} not found`);

  // Enhanced reactive query with proper subscription pattern
  const subscription = collection.subscribe(query, callback);

  // Return unsubscribe function
  return () => {
    if (subscription && typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe();
    }
  };
}

// Enhanced reactive query with change detection
async function subscribeToChanges(collectionName: string, callback: (change: any) => void) {
  const cols = await getCollections();
  const collection = cols[collectionName];
  if (!collection) throw new Error(`Collection ${collectionName} not found`);

  return collection.subscribeToChanges(callback);
}

// Seed admin credentials
async function seedAdmin() {
  const cols = await getCollections();
  const adminExists = await cols.users.findOne({ username: 'admin' });

  if (!adminExists) {
    await cols.users.insert({
      _id: 'admin-' + Date.now(),
      username: 'admin',
      password: 'admin123', // In production, hash this password!
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log('✓ Admin user seeded');
  }
}

// Initialize database on startup
async function initializeDatabase() {
  try {
    await getDatabase(); // Ensure database is initialized
    await seedAdmin();
    console.log('✓ Database initialized successfully');
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
}

// Backward compatibility exports - lazy collection proxy
export const collections: any = new Proxy({}, {
  get(target, prop) {
    if (typeof prop === 'symbol') return undefined;
    const collectionName = prop as string;

    return {
      insert: async (doc: any) => {
        const cols = await getCollections();
        const collection = cols[collectionName];
        if (!collection) throw new Error(`Collection ${collectionName} not found`);
        return collection.insert(doc);
      },
      find: (query?: any) => ({
        sort: (sortOptions: any) => ({
          toArray: async () => {
            const db = await getDatabase();
            // Use SQL query to find documents
            let sql = `SELECT * FROM ${collectionName}`;
            const params: any[] = [];

            if (query && Object.keys(query).length > 0) {
              const conditions = [];
              for (const [key, value] of Object.entries(query)) {
                conditions.push(`${key} = ?`);
                params.push(value);
              }
              sql += ` WHERE ${conditions.join(' AND ')}`;
            }

            // For now, ignore sort options
            return db.all(sql, params);
          }
        }),
        toArray: async () => {
          const db = await getDatabase();
          // Use SQL query to find documents
          let sql = `SELECT * FROM ${collectionName}`;
          const params: any[] = [];

          if (query && Object.keys(query).length > 0) {
            const conditions = [];
            for (const [key, value] of Object.entries(query)) {
              conditions.push(`${key} = ?`);
              params.push(value);
            }
            sql += ` WHERE ${conditions.join(' AND ')}`;
          }

          return db.all(sql, params);
        }
      }),
      findOne: async (query: any) => {
        const cols = await getCollections();
        const collection = cols[collectionName];
        if (!collection) throw new Error(`Collection ${collectionName} not found`);
        return collection.findOne(query);
      },
      update: async (query: any, update: any) => {
        const cols = await getCollections();
        const collection = cols[collectionName];
        if (!collection) throw new Error(`Collection ${collectionName} not found`);
        return collection.update(query, update);
      },
      delete: async (query: any) => {
        const cols = await getCollections();
        const collection = cols[collectionName];
        if (!collection) throw new Error(`Collection ${collectionName} not found`);
        return (collection as any).delete(query);
      },
      deleteMany: async (query: any) => {
        const cols = await getCollections();
        const collection = cols[collectionName];
        if (!collection) throw new Error(`Collection ${collectionName} not found`);
        // For now, just delete one by one since we don't have batch delete
        const results = await (collection as any).find(query);
        for (const item of results) {
          await (collection as any).delete({ _id: item._id });
        }
        return results.length;
      }
    };
  }
});

// Lazy db getter - initialize database on first access
let dbInitialized = false;

export const db: any = new Proxy({}, {
  get(target, prop) {
    if (typeof prop === 'symbol') return undefined;

    return async (...args: any[]) => {
      if (!dbInitialized) {
        await getDatabase();
        dbInitialized = true;
      }
      if (_db) {
        return (_db as any)[prop](...args);
      }
      throw new Error(`Database not available for method ${prop.toString()}`);
    };
  }
});

export {
  getDatabase,
  getCollections,
  insertBatch,
  updateBatch,
  deleteBatch,
  subscribeToQuery,
  subscribeToChanges,
  initializeDatabase
};
export default getDatabase;
