import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';
import { getAppDataDir } from '../lib/utils';

// Ensure data directory exists
const dataDir = getAppDataDir();
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory:', dataDir);
}

// Check if database initialization flag exists
const dbInitFlagPath = path.join(dataDir, '.db-initialized');
const isDbInitialized = fs.existsSync(dbInitFlagPath);

// Initialize SQLite database
const dbPath = path.join(dataDir, 'my-chat-brain.db');
const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Enable WAL mode for better concurrency
sqlite.pragma('journal_mode = WAL');

// Helper function to run SQL queries
const runQuery = (sql: string, params: any[] = []) => {
  try {
    return sqlite.prepare(sql).run(params);
  } catch (error) {
    console.error(`Error running query: ${sql}`, error);
    throw error;
  }
};

// Helper function to get a single row
const getRow = (sql: string, params: any[] = []) => {
  try {
    return sqlite.prepare(sql).get(params);
  } catch (error) {
    console.error(`Error getting row: ${sql}`, error);
    throw error;
  }
};

// Helper function to get multiple rows
const getRows = (sql: string, params: any[] = []) => {
  try {
    return sqlite.prepare(sql).all(params);
  } catch (error) {
    console.error(`Error getting rows: ${sql}`, error);
    throw error;
  }
};

// Helper function to execute SQL directly
const exec = (sql: string) => {
  try {
    return sqlite.exec(sql);
  } catch (error) {
    console.error(`Error executing SQL: ${sql}`, error);
    throw error;
  }
};

// Export the database connection, helper functions, and schema
export const db = {
  sqlite,
  run: runQuery,
  get: getRow,
  all: getRows,
  exec,
  close: () => sqlite.close(),
  schema
};

// Always ensure the tables exist, regardless of the initialization flag
console.log('Ensuring database tables exist');

try {
  // Create basic tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      role TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      content TEXT NOT NULL,
      title TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS memory_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      label TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('keyword', 'entity', 'message', 'topic', 'custom')),
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS memory_edges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      relation TEXT NOT NULL CHECK(relation IN ('related_to', 'mentioned_in', 'part_of', 'temporal', 'custom')),
      weight INTEGER NOT NULL CHECK(weight BETWEEN 1 AND 10),
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_id) REFERENCES memory_nodes(id) ON DELETE CASCADE,
      FOREIGN KEY (target_id) REFERENCES memory_nodes(id) ON DELETE CASCADE
    );
  `);

  // If this is the first run, create a flag file
  if (!isDbInitialized) {
    console.log('First run detected, creating database initialization flag');
    fs.writeFileSync(dbInitFlagPath, new Date().toISOString());
    console.log('Database initialization flag created');
  }
} catch (error) {
  console.error('Error initializing database:', error);
}
