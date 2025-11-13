import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import {
  chatSessionsToDTOs,
  chatMessageToHistoryItem,
  isValidChatSession,
  isValidChatMessage,
  safeTransform
} from '@/lib/dataTransformers';
import { ChatSession, ChatMessage } from '@/types';

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
          userId = decoded.userId || null;
        }
      } catch (error) {
        console.error('Token verification error:', error);
        // Continue without userId
      }
    }

    // Get database helper instance
    const dbHelper = await db();

    // Fetch chat sessions
    const sessions = await dbHelper.getChatSessions(userId);

    // Fetch messages for these sessions with proper transformation and validation
    const formattedSessions: ChatSession[] = await Promise.all(
      sessions.map(async (session: any) => {
        const messages = await dbHelper.getChatMessages(session._id);
        const sessionData = session;

        // Transform session data with validation
        const transformedSession = safeTransform(
          sessionData,
          (data) => ({
            id: parseInt(data.id),
            user_id: data.user_id || null,
            title: data.title,
            created_at: data.created_at,
            updated_at: data.updated_at
          }),
          `Failed to transform session ${sessionData.id}`
        );

        // Validate session
        if (!isValidChatSession(transformedSession)) {
          throw new Error(`Invalid session data for session ${sessionData.id}`);
        }

        // Transform messages with validation
        const transformedMessages: ChatMessage[] = messages.map((msg: any) => {
          const msgData = msg;
          const transformedMessage = safeTransform(
            msgData,
            (data) => ({
              id: parseInt(data.id),
              session_id: parseInt(data.session_id),
              content: data.content,
              role: data.role,
              timestamp: data.timestamp
            }),
            `Failed to transform message ${msgData.id}`
          );

          // Validate message
          if (!isValidChatMessage(transformedMessage)) {
            throw new Error(`Invalid message data for message ${msgData.id}`);
          }

          return transformedMessage;
        });

        return {
          ...transformedSession,
          messages: transformedMessages
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
