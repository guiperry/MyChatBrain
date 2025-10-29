#!/usr/bin/env node

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

function getAppDataDir() {
  const appName = 'My Chat Brain v2';
  const platform = os.platform();

  switch (platform) {
    case 'win32':
      return path.join(os.homedir(), 'AppData', 'Roaming', appName);
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', appName);
    case 'linux':
    default:
      return path.join(os.homedir(), '.local', 'share', appName.toLowerCase().replace(/\s+/g, '-'));
  }
}

const dataDir = getAppDataDir();
const dbPath = path.join(dataDir, 'my-chat-brain.db');

if (!fs.existsSync(dbPath)) {
  console.error('Database file does not exist');
  process.exit(1);
}

try {
  const sqlite = new Database(dbPath);

  // Check if tables exist
  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const tableNames = tables.map(t => t.name);

  const requiredTables = [
    'users',
    'settings',
    'chat_sessions',
    'chat_messages',
    'prompts',
    'notes',
    'memory_nodes',
    'memory_edges'
  ];

  const missingTables = requiredTables.filter(table => !tableNames.includes(table));

  if (missingTables.length > 0) {
    console.error(`Missing tables: ${missingTables.join(', ')}`);
    sqlite.close();
    process.exit(1);
  }

  console.log('Database check passed - all required tables exist');
  sqlite.close();
} catch (error) {
  console.error('Database check failed:', error.message);
  process.exit(1);
}
