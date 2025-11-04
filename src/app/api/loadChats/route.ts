import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { chatSessionsToDTOs } from '@/lib/dataTransformers';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get('gemini-auth-token')?.value;

    let userId = null;
    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded) {
          userId = decoded.userId;
        }
      } catch (error) {
        console.error('Token verification error:', error);
        // Continue without userId
      }
    }

    // Get RxDB helper instance
    const rxdbHelper = await db();

    // Fetch chat sessions
    const sessions = await rxdbHelper.getChatSessions(userId);

    // Fetch messages for these sessions
    const formattedSessions = await Promise.all(
      sessions.map(async (session) => {
        const messages = await rxdbHelper.getChatMessages(session.id);
        const sessionData = session.toJSON();
        return {
          id: parseInt(sessionData.id),
          user_id: sessionData.user_id || null,
          title: sessionData.title,
          created_at: sessionData.created_at,
          updated_at: sessionData.updated_at,
          messages: messages.map(msg => {
            const msgData = msg.toJSON();
            return {
              id: parseInt(msgData.id),
              session_id: parseInt(msgData.session_id),
              content: msgData.content,
              role: msgData.role,
              timestamp: msgData.timestamp
            };
          })
        };
      })
    );

    console.log(`Retrieved sessions with messages for user: ${userId || 'anonymous'}`);

    // Transform to DTOs for API response
    const sessionDTOs = chatSessionsToDTOs(formattedSessions);

    return NextResponse.json({ sessions: sessionDTOs });
  } catch (error) {
    console.error('Error loading chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
