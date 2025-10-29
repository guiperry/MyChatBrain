import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    console.log('Checking database status...');
    
    // Check if the database file exists
    const dbPath = path.resolve('./data/my-chat-brain.db');
    const dbExists = fs.existsSync(dbPath);
    const dbSize = dbExists ? fs.statSync(dbPath).size : 0;
    
    // Try to connect to the database directly
    let tables: string[] = [];
    let error = null;
    
    try {
      const sqlite = new Database(dbPath);
      
      try {
        // Get a list of tables
        const result = sqlite.prepare(`
          SELECT name FROM sqlite_master 
          WHERE type='table' 
          ORDER BY name
        `).all() as any[];
        
        tables = result.map(row => row.name);
      } finally {
        sqlite.close();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }
    
    // Return the database status
    return NextResponse.json({
      status: 'success',
      database: {
        exists: dbExists,
        path: dbPath,
        size: dbSize,
        tables,
        error
      }
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}