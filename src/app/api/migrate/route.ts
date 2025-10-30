import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { getRxDBHelper } from '@/db/rxdb';

export async function POST(request: NextRequest) {
  console.log('Migration API called');

  try {
    // Get RxDB helper
    const rxdbHelper = await getRxDBHelper();

    // Get the SQLite database path
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
      return NextResponse.json({
        success: false,
        message: 'SQLite database not found. Nothing to migrate.'
      });
    }

    // Connect to SQLite database
    const sqlite = new Database(dbPath);

    console.log('Starting data migration from SQLite to RxDB...');

    // Migration functions
    async function migrateTable(tableName: string, sqliteQuery: string, rxdbInsertFunction: (row: any) => Promise<any>) {
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
        return rows.length;
      } catch (error) {
        console.error(`Error migrating ${tableName}:`, error);
        return 0;
      }
    }

    // Perform migration
    const results = {
      users: await migrateTable('users', 'SELECT * FROM users', async (row) => {
        const user = await rxdbHelper.createUser({
          username: row.username,
          email: row.email,
          password: row.password
        });
        return user;
      }),
      settings: await migrateTable('settings', 'SELECT * FROM settings', async (row) => {
        return await rxdbHelper.setSetting(row.user_id, row.key, row.value || '');
      }),
      chat_sessions: await migrateTable('chat_sessions', 'SELECT * FROM chat_sessions', async (row) => {
        return await rxdbHelper.createChatSession({
          title: row.title,
          user_id: row.user_id
        });
      }),
      chat_messages: await migrateTable('chat_messages', 'SELECT * FROM chat_messages', async (row) => {
        return await rxdbHelper.addChatMessage({
          session_id: row.session_id,
          content: row.content,
          role: row.role,
          timestamp: row.timestamp
        });
      }),
      prompts: await migrateTable('prompts', 'SELECT * FROM prompts', async (row) => {
        return await rxdbHelper.createPrompt({
          content: row.content,
          title: row.title,
          user_id: row.user_id
        });
      }),
      notes: await migrateTable('notes', 'SELECT * FROM notes', async (row) => {
        return await rxdbHelper.createNote({
          title: row.title,
          content: row.content,
          user_id: row.user_id
        });
      }),
      memory_nodes: await migrateTable('memory_nodes', 'SELECT * FROM memory_nodes', async (row) => {
        return await rxdbHelper.createMemoryNode({
          label: row.label,
          type: row.type,
          user_id: row.user_id,
          metadata: row.metadata || ''
        });
      }),
      memory_edges: await migrateTable('memory_edges', 'SELECT * FROM memory_edges', async (row) => {
        return await rxdbHelper.createMemoryEdge({
          source_id: row.source_id,
          target_id: row.target_id,
          relation: row.relation,
          weight: row.weight,
          metadata: row.metadata || ''
        });
      })
    };

    // Close SQLite connection
    sqlite.close();

    // Optional: Backup the old SQLite database
    const backupPath = path.join(dataDir, 'my-chat-brain.db.backup');
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(dbPath, backupPath);
      console.log(`SQLite database backed up to: ${backupPath}`);
    }

    const totalMigrated = Object.values(results).reduce((sum, count) => sum + count, 0);

    console.log('Migration completed successfully!');
    console.log(`Total records migrated: ${totalMigrated}`);

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully!',
      results,
      totalMigrated
    });

  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Migration failed',
        error: error.toString()
      },
      { status: 500 }
    );
  }
}
