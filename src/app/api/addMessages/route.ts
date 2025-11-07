import { NextRequest, NextResponse } from 'next/server';
import { getRxDBHelper } from '@/db/rxdb';
import { ChatHistoryItem } from '@/types';
import {
  isValidChatHistoryItemsArray,
  historyItemToChatMessage,
  safeTransform
} from '@/lib/dataTransformers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, messages } = body as {
      sessionId: string | number;
      messages: ChatHistoryItem[];
    };

    // Validate input
    if (!sessionId || !messages) {
      return NextResponse.json({ error: 'Missing sessionId or messages' }, { status: 400 });
    }

    // Validate messages array using type guard
    if (!isValidChatHistoryItemsArray(messages) || messages.length === 0) {
      return NextResponse.json({
        error: 'Invalid messages format',
        details: 'Messages must be an array of objects with text and type properties'
      }, { status: 400 });
    }

    console.log(`Adding ${messages.length} messages to session ${sessionId}`);

    try {
      // Get RxDB helper instance
      const rxdbHelper = await getRxDBHelper();

      // First, verify that the session exists
      const session = await rxdbHelper.getChatSession(sessionId);
      if (!session) {
        console.error(`Session with ID ${sessionId} does not exist`);
        return NextResponse.json({
          error: `Session with ID ${sessionId} does not exist`
        }, { status: 404 });
      }

      console.log(`Verified session ${sessionId} exists, proceeding with message insertion`);

      // Insert messages using RxDB helper with proper transformation
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];

        // Use safe transformation to convert ChatHistoryItem to ChatMessage
        const chatMessage = safeTransform(
          message,
          (msg) => historyItemToChatMessage(msg, sessionId as number),
          `Failed to transform message ${i + 1}`
        );

        await rxdbHelper.addChatMessage(chatMessage);
      }

      console.log(`Inserted ${messages.length} messages for session ${sessionId}`);

      return NextResponse.json({
        message: 'Messages added successfully',
        count: messages.length
      }, { status: 201 });
    } catch (error) {
      console.error(`Error inserting messages for session ${sessionId}:`, error);
      throw error;
    }
  } catch (error) {
    console.error('Add messages error:', error);

    // Provide more specific error messages for debugging
    if (error instanceof Error) {
      return NextResponse.json({
        error: 'Database error',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
