import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { DecodedToken } from '@/types';
import { typedGet, typedRun } from '@/db/types';

export async function DELETE(request: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get('gemini-auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token) as DecodedToken | null;
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get sessionId from URL
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Parse sessionId to ensure it's a valid integer
    const parsedSessionId = parseInt(sessionId);
    if (isNaN(parsedSessionId)) {
      return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
    }

    try {
      // Get the chat session
      const session = typedGet<{ id: number; user_id: number | null }>(
        db,
        'SELECT * FROM chat_sessions WHERE id = ?',
        [parsedSessionId]
      );

      if (!session) {
        throw new Error('Chat session not found');
      }

      // Check if the user owns this session
      if (session.user_id !== decoded.userId) {
        throw new Error('Not authorized to delete this chat session');
      }

      // Use a transaction to ensure database consistency
      db.sqlite.exec('BEGIN TRANSACTION');

      // Delete all messages in the session first (due to foreign key constraint)
      typedRun(
        db,
        'DELETE FROM chat_messages WHERE session_id = ?',
        [parsedSessionId]
      );

      // Then delete the session
      typedRun(
        db,
        'DELETE FROM chat_sessions WHERE id = ?',
        [parsedSessionId]
      );

      // Commit the transaction
      db.sqlite.exec('COMMIT');
    } catch (error) {
      // Rollback the transaction if there was an error
      try {
        db.sqlite.exec('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }

      throw error;
    }

    return NextResponse.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);

    // Provide more specific error messages based on the error
    if (error instanceof Error) {
      if (error.message === 'Chat session not found') {
        return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
      }

      if (error.message === 'Not authorized to delete this chat session') {
        return NextResponse.json({ error: 'Not authorized to delete this chat session' }, { status: 403 });
      }

      if (error.message.includes('FOREIGN KEY constraint failed')) {
        return NextResponse.json({
          error: 'Database constraint error: Could not delete the chat session',
          details: error.message
        }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}