import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { DecodedToken, CreateChatSessionInput } from '@/types';

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
      // Get RxDB helper instance
      const rxdbHelper = await db();

      // Create the chat session using RxDB helper
      const session = await rxdbHelper.createChatSession({
        title,
        user_id: userId
      });

      const newSessionId = session.id;

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
