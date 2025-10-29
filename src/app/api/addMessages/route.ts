import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ChatHistoryItem } from '@/types';
import { typedGet } from '@/db/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, messages } = body as { 
      sessionId: number; 
      messages: ChatHistoryItem[];
    };

    // Validate input
    if (!sessionId || !messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    console.log(`Adding ${messages.length} messages to session ${sessionId}`);

    // First, verify that the session exists
    const sessionExists = typedGet<{ id: number }>(
      db,
      'SELECT id FROM chat_sessions WHERE id = ?',
      [sessionId]
    );

    if (!sessionExists) {
      console.error(`Session with ID ${sessionId} does not exist`);
      return NextResponse.json({
        error: `Session with ID ${sessionId} does not exist`
      }, { status: 404 });
    }

    console.log(`Verified session ${sessionId} exists, proceeding with message insertion`);

    // Insert messages in batches to avoid potential issues with large payloads
    const BATCH_SIZE = 20;
    try {
      // Prepare the insert statement once
      const insertStmt = db.sqlite.prepare(
        `INSERT INTO chat_messages (session_id, content, role, timestamp)
         VALUES (?, ?, ?, ?)`
      );

      // Begin a transaction for better performance
      db.sqlite.exec('BEGIN TRANSACTION');

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const timestamp = new Date().toISOString();

        insertStmt.run(
          sessionId,
          message.text,
          message.type,
          timestamp
        );
      }

      // Commit the transaction
      db.sqlite.exec('COMMIT');

      console.log(`Inserted ${messages.length} messages for session ${sessionId}`);
    } catch (error) {
      // Rollback the transaction if there was an error
      try {
        db.sqlite.exec('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }

      console.error(`Error inserting messages for session ${sessionId}:`, error);
      throw error;
    }

    return NextResponse.json({ 
      message: 'Messages added successfully',
      count: messages.length
    }, { status: 201 });
  } catch (error) {
    console.error('Add messages error:', error);
    
    // Provide more specific error messages for debugging
    if (error instanceof Error) {
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        return NextResponse.json({ 
          error: 'Database constraint error: The chat session may not exist',
          details: error.message
        }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}