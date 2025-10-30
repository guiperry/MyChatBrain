import { NextRequest, NextResponse } from 'next/server';
import { getRxDBHelper } from '@/db/rxdb';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { DecodedToken, ChatHistoryItem } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Get RxDB helper
    const rxdbHelper = await getRxDBHelper();

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

    // Create or update the session first
    let sessionId: number;

    if (existingSessionId) {
      // Check if the session exists
      const existingSession = await rxdbHelper.getChatSession(existingSessionId);

      if (existingSession) {
        // Update the existing session
        await rxdbHelper.updateChatSession(existingSessionId, { title });
        sessionId = existingSessionId;

        // Delete existing messages for this session
        await rxdbHelper.deleteChatMessages(existingSessionId);
      } else {
        // Session doesn't exist, create a new one
        const newSession = await rxdbHelper.createChatSession({
          title,
          user_id: userId
        });
        sessionId = newSession.id;
      }
    } else {
      // Create a new chat session
      const newSession = await rxdbHelper.createChatSession({
        title,
        user_id: userId
      });
      sessionId = newSession.id;
    }

    // Verify the session was created/updated successfully
    console.log(`Session created/updated with ID: ${sessionId}`);

    // Now insert all messages using the session ID we now have
    try {
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const msgTimestamp = new Date().toISOString();

        await rxdbHelper.addChatMessage({
          session_id: sessionId,
          content: message.text,
          role: message.type,
          timestamp: msgTimestamp
        });
      }

      console.log(`Inserted ${messages.length} messages for session ${sessionId}`);
    } catch (error) {
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
      if (error.message.includes('constraint') || error.message.includes('foreign key')) {
        return NextResponse.json({
          error: 'Database constraint error: The chat session may not exist or was deleted',
          details: error.message
        }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
