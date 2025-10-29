import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import type { Users } from '@/db/schema';

interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
}
import { processMessage } from '@/lib/memoryExtractor';

// POST /api/memory/process - Process a message and update the memory graph
export async function POST(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    const user = session?.user as AuthenticatedUser | null;
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the session
    const userEmail = user.email;
    const dbUser = await db.get(
      'SELECT id FROM users WHERE email = ?',
      [userEmail]
    ) as Users | null;
    if (!dbUser?.id) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Parse the request body
    const body = await req.json();
    const { message } = body;

    // Validate the request
    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Process the message
    const result = await processMessage(message, dbUser.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to process message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Message processed successfully'
    });
  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process message' },
      { status: 500 }
    );
  }
}