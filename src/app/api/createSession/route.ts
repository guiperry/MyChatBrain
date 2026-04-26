import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/db/nebuladb-helper';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { DecodedToken } from '@/types';
import { initializeDatabase } from '@/db/nebuladb';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get('gemini-auth-token')?.value;

    let userId: number | null = null;
    if (token) {
      const decoded = verifyToken(token) as DecodedToken | null;
      if (decoded) {
        userId = Number(decoded.userId);
      }
    }

    const body = await request.json();
    const { title } = body as { title: string };

    // Validate input
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({
        error: 'Title is required and must be a non-empty string'
      }, { status: 400 });
    }

    console.log(`Creating new session with title: ${title} and userId: ${userId}`);

    try {
      // Ensure database is initialized
      await initializeDatabase();

      // Get database helper instance
      const dbHelper = await getNebulaDBHelper();

      // Create the chat session using database helper
      const session = await dbHelper.createChatSession({
        title,
        user_id: userId || 0
      });

      const newSessionId = session.id || session._id || Date.now().toString();

      console.log(`New session created with ID: ${newSessionId}`);

      return NextResponse.json({
        message: 'Session created successfully',
        sessionId: newSessionId
      }, { status: 201 });
    } catch (error) {
      console.error('Error creating session:', error);

      return NextResponse.json({
        error: 'Failed to create session',
        details: error instanceof Error ? error.message : 'Database error'
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
