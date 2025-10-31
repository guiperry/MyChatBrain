import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

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
    let userSessions: any[] = [];
    if (userId) {
      userSessions = db.all('SELECT * FROM chat_sessions WHERE user_id = ? OR user_id IS NULL ORDER BY updated_at DESC', [userId]);
    } else {
      userSessions = db.all('SELECT * FROM chat_sessions ORDER BY updated_at DESC');
    }

    // Fetch messages for these sessions
    const sessionIds = userSessions.map(session => session.id);

    let allMessages: any[] = [];
    if (sessionIds.length > 0) {
      // Get all messages for all sessions
      const placeholders = sessionIds.map(() => '?').join(',');
      allMessages = db.all(`SELECT * FROM chat_messages WHERE session_id IN (${placeholders}) ORDER BY timestamp ASC`, sessionIds);
    }

    console.log(`Retrieved ${allMessages.length} messages for ${sessionIds.length} sessions`);

    // Group messages by session_id
    const messagesBySession = allMessages.reduce<Record<number, any[]>>(
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
