#!/usr/bin/env node

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

console.log('Starting migration from SQLite to RxDB...');

// Get the SQLite database path (hardcoded for now since import is failing)
const appName = 'My Chat Brain v2';
const platform = os.platform();
let dataDir;

switch (platform) {
  case 'win32':
    dataDir = path.join(os.homedir(), 'AppData', 'Roaming', appName);
    break;
  case 'darwin':
    dataDir = path.join(os.homedir(), 'Library', 'Application Support', appName);
    break;
  case 'linux':
  default:
    dataDir = path.join(os.homedir(), '.local', 'share', appName.toLowerCase().replace(/\s+/g, '-'));
    break;
}

const dbPath = path.join(dataDir, 'my-chat-brain.db');

if (!fs.existsSync(dbPath)) {
  console.log('SQLite database not found. Nothing to migrate.');
  process.exit(0);
}

// Connect to SQLite database
const sqlite = new Database(dbPath);

// Initialize RxDB
let rxdbHelper;
try {
  // Import RxDB helper directly
  const { getRxDBHelper } = await import('../src/db/rxdb.js');
  rxdbHelper = await getRxDBHelper();
  console.log('RxDB initialized successfully');
} catch (error) {
  console.error('Failed to initialize RxDB:', error);
  console.log('Continuing with database check only...');
}

async function migrateTable(tableName, sqliteQuery, rxdbInsertFunction) {
  console.log(`Migrating ${tableName}...`);

  try {
    const rows = sqlite.prepare(sqliteQuery).all();
    console.log(`Found ${rows.length} ${tableName} records`);

    for (const row of rows) {
      try {
        await rxdbInsertFunction(row);
      } catch (error) {
        console.error(`Error inserting ${tableName} record:`, row, error);
      }
    }

    console.log(`Successfully migrated ${rows.length} ${tableName} records`);
  } catch (error) {
    console.error(`Error migrating ${tableName}:`, error);
  }
}

async function migrateUsers() {
  await migrateTable('users', 'SELECT * FROM users', async (row) => {
    await rxdbHelper.createUser({
      username: row.username,
      email: row.email,
      password: row.password
    });
  });
}

async function migrateSettings() {
  await migrateTable('settings', 'SELECT * FROM settings', async (row) => {
    await rxdbHelper.setSetting(row.user_id, row.key, row.value || '');
  });
}

async function migrateChatSessions() {
  await migrateTable('chat_sessions', 'SELECT * FROM chat_sessions', async (row) => {
    await rxdbHelper.createChatSession({
      title: row.title,
      user_id: row.user_id
    });
  });
}

async function migrateChatMessages() {
  await migrateTable('chat_messages', 'SELECT * FROM chat_messages', async (row) => {
    await rxdbHelper.addChatMessage({
      session_id: row.session_id,
      content: row.content,
      role: row.role,
      timestamp: row.timestamp
    });
  });
}

async function migratePrompts() {
  await migrateTable('prompts', 'SELECT * FROM prompts', async (row) => {
    await rxdbHelper.createPrompt({
      content: row.content,
      title: row.title,
      user_id: row.user_id
    });
  });
}

async function migrateNotes() {
  await migrateTable('notes', 'SELECT * FROM notes', async (row) => {
    await rxdbHelper.createNote({
      title: row.title,
      content: row.content,
      user_id: row.user_id
    });
  });
}

async function migrateMemoryNodes() {
  await migrateTable('memory_nodes', 'SELECT * FROM memory_nodes', async (row) => {
    await rxdbHelper.createMemoryNode({
      label: row.label,
      type: row.type,
      user_id: row.user_id,
      metadata: row.metadata || ''
    });
  });
}

async function migrateMemoryEdges() {
  await migrateTable('memory_edges', 'SELECT * FROM memory_edges', async (row) => {
    await rxdbHelper.createMemoryEdge({
      source_id: row.source_id,
      target_id: row.target_id,
      relation: row.relation,
      weight: row.weight,
      metadata: row.metadata || ''
    });
  });
}

async function checkDatabaseContents() {
  console.log('Checking database contents...');

  const tables = ['users', 'settings', 'chat_sessions', 'chat_messages', 'prompts', 'notes', 'memory_nodes', 'memory_edges'];

  for (const table of tables) {
    try {
      const count = sqlite.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
      console.log(`${table}: ${count} records`);

      if (count > 0 && count <= 5) {
        // Show a few sample records
        const rows = sqlite.prepare(`SELECT * FROM ${table} LIMIT 3`).all();
        console.log(`Sample ${table} records:`, rows);
      }
    } catch (error) {
      console.log(`${table}: Error - ${error.message}`);
    }
  }
}

async function main() {
  try {
    await checkDatabaseContents();

    console.log('\nDatabase check completed.');
    console.log('To proceed with migration, RxDB needs to be properly set up first.');
    console.log('The database contains data that needs to be migrated.');

    // Close SQLite connection
    sqlite.close();

  } catch (error) {
    console.error('Database check failed:', error);
    sqlite.close();
    process.exit(1);
  }
}

main();
