import { NextRequest, NextResponse } from 'next/server';
import { getRxDBHelper } from '@/db/rxdb';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { DecodedToken } from '@/types';

export async function DELETE(request: NextRequest) {
  try {
    // Get RxDB helper
    const rxdbHelper = await getRxDBHelper();

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

    if (!sessionId?.trim()) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Parse sessionId to ensure it's a valid integer
    const parsedSessionId = parseInt(sessionId.trim());
    if (isNaN(parsedSessionId) || parsedSessionId <= 0) {
      return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
    }

    // Get the chat session to verify ownership
    const session = await rxdbHelper.getChatSession(parsedSessionId);

    if (!session) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // Check if the user owns this session (convert user ID for comparison)
    if (session.user_id !== null && session.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Not authorized to delete this chat session' }, { status: 403 });
    }

    // Delete the chat session (RxDB handles cascading deletes automatically)
    await rxdbHelper.deleteChatSession(parsedSessionId);

    return NextResponse.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);

    // Provide more specific error messages based on the error
    if (error instanceof Error) {
      // RxDB-specific error handling
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
      }

      if (error.message.includes('constraint') || error.message.includes('foreign key')) {
        return NextResponse.json({
          error: 'Database constraint error: Could not delete the chat session',
          details: error.message
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
