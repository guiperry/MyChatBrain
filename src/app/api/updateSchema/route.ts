import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    console.log('Checking if database schema update is needed...');

    // Check if we've already run this migration
    const migrationFlagPath = path.resolve('./data/.schema-updated');
    const isMigrationDone = fs.existsSync(migrationFlagPath);

    if (isMigrationDone) {
      console.log('Database schema already updated, skipping migration');
      return NextResponse.json({ message: 'Database schema already updated' });
    }

    console.log('Running database schema update...');

    try {
      // Drop the existing foreign key constraint
      db.exec('PRAGMA foreign_keys = OFF;');
      console.log('Foreign keys disabled');

      // Check if the chat_sessions table exists
      const tableExists = db.all(
        'SELECT name FROM sqlite_master WHERE type="table" AND name="chat_sessions"'
      );

      // Only perform the migration if the table exists
      if (tableExists && tableExists.length > 0) {
        // Create a new table without the foreign key constraint
        db.exec(`
          CREATE TABLE IF NOT EXISTS new_chat_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('Created new table structure');

        // Copy data from the old table to the new one
        db.exec(`
          INSERT INTO new_chat_sessions (id, user_id, title, created_at, updated_at)
          SELECT id, user_id, title, created_at, updated_at FROM chat_sessions;
        `);
        console.log('Copied data to new table');

        // Drop the old table
        db.exec('DROP TABLE chat_sessions;');
        console.log('Dropped old table');

        // Rename the new table to the original name
        db.exec('ALTER TABLE new_chat_sessions RENAME TO chat_sessions;');
        console.log('Renamed new table');
      } else {
        // If the table doesn't exist, create it
        db.exec(`
          CREATE TABLE IF NOT EXISTS chat_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('Created chat_sessions table');
      }

      // Turn foreign keys back on
      db.exec('PRAGMA foreign_keys = ON;');
      console.log('Foreign keys enabled');

      // Create the migration flag file
      fs.writeFileSync(migrationFlagPath, new Date().toISOString());
      console.log('Migration flag created');
    } catch (migrationError) {
      console.error('Error during migration:', migrationError);
      throw migrationError;
    }

    console.log('Database schema updated successfully');

    return NextResponse.json({ 
      message: 'Database schema updated successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating database schema:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}