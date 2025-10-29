import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { DecodedToken } from '@/types';
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
    const { title } = body as { title: string };

    // Validate input
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    console.log(`Creating new session with title: ${title} and userId: ${userId}`);

    try {
      // Create a unique timestamp for this session
      const timestamp = new Date().toISOString();

      // Insert the session with SQL
      // Only include userId if it's not null to avoid foreign key constraint errors
      let result;

      if (userId !== null) {
        // Insert with userId
        db.run(
          `INSERT INTO chat_sessions (user_id, title, created_at, updated_at)
           VALUES (?, ?, ?, ?)`,
          [userId, title, timestamp, timestamp]
        );
      } else {
        // Insert without userId (it will be NULL)
        db.run(
          `INSERT INTO chat_sessions (title, created_at, updated_at)
           VALUES (?, ?, ?)`,
          [title, timestamp, timestamp]
        );
      }

      // Get the last inserted ID
      const lastIdResult = typedGet<{ id: number }>(db, 'SELECT last_insert_rowid() as id');

      // Log the result to help debug
      console.log('Last insert ID result:', JSON.stringify(lastIdResult));

      // Extract the ID
      const newSessionId = lastIdResult ? lastIdResult.id : null;

      if (newSessionId) {
        console.log(`New session created with ID: ${newSessionId}`);

        return NextResponse.json({
          message: 'Session created successfully',
          sessionId: newSessionId
        }, { status: 201 });
      } else {
        throw new Error('Failed to get ID from last_insert_rowid()');
      }
    } catch (error) {
      console.error('Error creating session:', error);

      // If the operation fails, suggest fixing the database
      return NextResponse.json({
        error: 'Failed to create session',
        details: 'Database error. Try visiting /api/fixDatabase to repair the database schema.'
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