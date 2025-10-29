import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { DecodedToken, ChatHistoryItem } from '@/types';
import { typedGet, typedRun } from '@/db/types';

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
    const { title, messages, sessionId: existingSessionId } = body as {
      title: string;
      messages: ChatHistoryItem[];
      sessionId?: number | null
    };

    // Log the received data for debugging
    console.log('saveChat received:', {
      title,
      messageCount: messages?.length,
      existingSessionId: existingSessionId
    });

    // Validate input
    if (!title || !messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid chat data' }, { status: 400 });
    }

    // Create or update the session first, outside of the transaction
    let sessionId: number | null = null;

    const timestamp = new Date().toISOString();

    if (existingSessionId) {
      // Check if the session exists
      const existingSession = typedGet<{ id: number; title: string }>(
        db,
        'SELECT * FROM chat_sessions WHERE id = ?',
        [existingSessionId]
      );

      if (existingSession) {
        // Update the existing session
        typedRun(
          db,
          'UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?',
          [title, timestamp, existingSessionId]
        );

        // Use the existing session ID
        sessionId = existingSessionId;

        // Delete existing messages for this session
        typedRun(
          db,
          'DELETE FROM chat_messages WHERE session_id = ?',
          [existingSessionId]
        );
      } else {
        // Session doesn't exist, create a new one
        if (userId !== null) {
          // Insert with userId
          typedRun(
            db,
            `INSERT INTO chat_sessions (user_id, title, created_at, updated_at)
             VALUES (?, ?, ?, ?)`,
            [userId, title, timestamp, timestamp]
          );
        } else {
          // Insert without userId (it will be NULL)
          typedRun(
            db,
            `INSERT INTO chat_sessions (title, created_at, updated_at)
             VALUES (?, ?, ?)`,
            [title, timestamp, timestamp]
          );
        }

        // Get the last inserted ID
        const lastIdResult = typedGet<{ id: number }>(db, 'SELECT last_insert_rowid() as id');
        sessionId = lastIdResult ? lastIdResult.id : null;

        if (!sessionId) {
          throw new Error('Failed to get last inserted ID');
        }
      }
    } else {
      // Create a new chat session
      if (userId !== null) {
        // Insert with userId
        typedRun(
          db,
          `INSERT INTO chat_sessions (user_id, title, created_at, updated_at)
           VALUES (?, ?, ?, ?)`,
          [userId, title, timestamp, timestamp]
        );
      } else {
        // Insert without userId (it will be NULL)
        typedRun(
          db,
          `INSERT INTO chat_sessions (title, created_at, updated_at)
           VALUES (?, ?, ?)`,
          [title, timestamp, timestamp]
        );
      }

      // Get the last inserted ID
      const lastIdResult = typedGet<{ id: number }>(db, 'SELECT last_insert_rowid() as id');
      sessionId = lastIdResult ? lastIdResult.id : null;

      if (!sessionId) {
        throw new Error('Failed to get last inserted ID');
      }
    }

    // Verify the session was created/updated successfully
    console.log(`Session created/updated with ID: ${sessionId}`);

    // Make sure we have a valid session ID
    if (!sessionId) {
      throw new Error('No valid session ID available');
    }

    // Now insert all messages using the session ID we now have
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
        const msgTimestamp = new Date().toISOString();

        insertStmt.run(
          sessionId,
          message.text,
          message.type,
          msgTimestamp
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
      message: 'Chat saved successfully',
      sessionId: sessionId
    }, { status: 201 });
  } catch (error) {
    console.error('Save chat error:', error);

    // Provide more specific error messages for debugging
    if (error instanceof Error) {
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        return NextResponse.json({
          error: 'Database constraint error: The chat session may not exist or was deleted',
          details: error.message
        }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}