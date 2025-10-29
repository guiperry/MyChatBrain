import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
// Note: This route already uses direct SQL queries
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

interface ChatMessage {
  id: number;
  role: 'user' | 'bot';
  timestamp: string;
  session_id: number;  // This matches the database column name
  content: string;
}

interface ChatSession {
  id: number;
  title: string;
  created_at: string;  // This matches the database column name
  updated_at: string;  // This matches the database column name
  user_id: number | null;  // This matches the database column name
}

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

    // Fetch chat sessions
    let userSessions: ChatSession[] = [];

    if (userId) {
      // If user is authenticated, fetch their sessions
      userSessions = db.all(
        'SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC',
        [userId]
      ) as ChatSession[];
    } else {
      // If not authenticated, fetch sessions without a userId (anonymous sessions)
      userSessions = db.all(
        'SELECT * FROM chat_sessions WHERE user_id IS NULL ORDER BY updated_at DESC'
      ) as ChatSession[];
    }

    // Fetch messages for these sessions
    const sessionIds = userSessions.map(session => session.id);

    let allMessages: ChatMessage[] = [];
    if (sessionIds.length > 0) {
      // Convert array to comma-separated string for SQL IN clause
      const sessionIdsStr = sessionIds.join(',');
      allMessages = db.sqlite.prepare(
        `SELECT * FROM chat_messages WHERE session_id IN (${sessionIdsStr}) ORDER BY id ASC`
      ).all() as ChatMessage[];
    }

    console.log(`Retrieved ${allMessages.length} messages for ${sessionIds.length} sessions`);

    // Group messages by session_id
    const messagesBySession = allMessages.reduce<Record<number, ChatMessage[]>>(
      (acc, msg) => {
        if (!acc[msg.session_id]) {
          acc[msg.session_id] = [];
        }
        acc[msg.session_id].push(msg);
        return acc;
      },
      {}
    );

    // Log the number of messages per session - safely
    if (Object.keys(messagesBySession).length > 0) {
      Object.keys(messagesBySession).forEach(sessionId => {
        const messages = messagesBySession[Number(sessionId)];
        if (messages) {
          console.log(`Session ${sessionId} has ${messages.length} messages`);
        }
      });
    }

    // Format the data for the response
    const formattedSessions = userSessions.map((session) => ({
      ...session,
      messages: messagesBySession[session.id] || [], // Add messages to each session
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Error loading chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}