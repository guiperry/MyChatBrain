#!/usr/bin/env node

// Database migration script
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve('./data/my-chat-brain.db');

if (!fs.existsSync(dbPath)) {
  console.error('Database file does not exist. Run init-db first.');
  process.exit(1);
}

const sqlite = new Database(dbPath);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

console.log('Running database migrations...');

// Add migration logic here as needed
// For now, this is a placeholder for future migrations

console.log('Database migrations completed successfully');

sqlite.close();
