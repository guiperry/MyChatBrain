import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { DecodedToken } from '@/types';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    console.log('Delete chat request received:', { params });

    // Get database helper
    const dbHelper = await db();

    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get('gemini-auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { sessionId } = params;

    if (!sessionId?.trim()) {
      return NextResponse.json({ 
        error: 'Session ID is required',
        details: { sessionId, params }
      }, { status: 400 });
    }

    // Get the session to verify it exists
    const session = await dbHelper.getChatSession(sessionId);

    if (!session) {
      return NextResponse.json({
        error: 'Chat session not found',
        details: { sessionId }
      }, { status: 404 });
    }

    // Verify token and ownership
    const decoded = verifyToken(token) as DecodedToken | null;
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if the user owns this session
    if (session.user_id !== null && session.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Not authorized to delete this chat session' }, { status: 403 });
    }

    // Delete the chat session
    await dbHelper.deleteChatSession(sessionId);
    console.log('Successfully deleted chat session:', sessionId);

    return NextResponse.json({ 
      message: 'Chat session deleted successfully',
      sessionId: sessionId
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    
    // Provide more specific error messages for debugging
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Chat session not found',
          details: error.message
        }, { status: 404 });
      }
    }

    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}