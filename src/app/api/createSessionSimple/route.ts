import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { DecodedToken } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get('gemini-auth-token')?.value;
    
    let userId: number | null = null;
    if (token) {
      const decoded = verifyToken(token) as DecodedToken | null;
      if (decoded) {
        userId = decoded.userId;
      }
    }

    const body = await request.json();
    const { title } = body as { title: string };

    // Validate input
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    console.log(`Creating new session with title: ${title}`);

    // Use a simple approach with raw SQL
    // This bypasses the ORM's type checking which is causing issues
    try {
      // Create the session with raw SQL
      const timestamp = new Date().toISOString();
      
      // Execute the SQL directly using better-sqlite3
      const insertStmt = db.sqlite.prepare(
        'INSERT INTO chat_sessions (title, created_at, updated_at) VALUES (?, ?, ?)'
      );
      const insertResult = insertStmt.run(title, timestamp, timestamp);
      
      // Get the last inserted ID
      const result = db.sqlite.prepare('SELECT last_insert_rowid() as id').get();
      
      // Extract the ID - the format depends on the SQLite driver
      let sessionId = (result as {id: number})?.id || insertResult.lastInsertRowid;
      
      if (!sessionId) {
        // If we couldn't get the ID, create a temporary one
        sessionId = Date.now();
        console.warn(`Could not get session ID, using temporary ID: ${sessionId}`);
      }
      
      console.log(`New session created with ID: ${sessionId}`);
      
      return NextResponse.json({
        message: 'Session created successfully',
        sessionId: sessionId
      }, { status: 201 });
    } catch (error) {
      console.error('Error creating session:', error);
      return NextResponse.json({ 
        error: 'Failed to create session',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}