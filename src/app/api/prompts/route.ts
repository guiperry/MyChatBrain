import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { DecodedToken } from '@/types';
import { typedAll, typedGet, typedRun } from '@/db/types';
import { Prompt } from '@/db/types';

// GET /api/prompts - Get all prompts for the current user
export async function GET(request: NextRequest) {
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

    // Fetch prompts
    let prompts: Prompt[] = [];

    if (userId) {
      // If user is authenticated, fetch their prompts
      prompts = typedAll<Prompt>(
        db,
        'SELECT * FROM prompts WHERE user_id = ? ORDER BY updated_at DESC',
        [userId]
      );
    } else {
      // If not authenticated, fetch prompts without a userId (anonymous prompts)
      prompts = typedAll<Prompt>(
        db,
        'SELECT * FROM prompts WHERE user_id IS NULL ORDER BY updated_at DESC'
      );
    }

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Error loading prompts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/prompts - Create a new prompt
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
    const { content, title } = body as { content: string; title?: string };

    // Validate input
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Create a unique timestamp for this prompt
    const timestamp = new Date().toISOString();

    // Insert the prompt
    let result;
    if (userId !== null) {
      // Insert with userId
      typedRun(
        db,
        `INSERT INTO prompts (user_id, content, title, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, content, title || null, timestamp, timestamp]
      );
    } else {
      // Insert without userId (it will be NULL)
      typedRun(
        db,
        `INSERT INTO prompts (content, title, created_at, updated_at)
         VALUES (?, ?, ?, ?)`,
        [content, title || null, timestamp, timestamp]
      );
    }

    // Get the last inserted ID
    const lastIdResult = typedGet<{ id: number }>(db, 'SELECT last_insert_rowid() as id');
    const promptId = lastIdResult ? lastIdResult.id : null;

    if (!promptId) {
      throw new Error('Failed to get last inserted ID');
    }

    // Get the newly created prompt
    const prompt = typedGet<Prompt>(
      db,
      'SELECT * FROM prompts WHERE id = ?',
      [promptId]
    );

    return NextResponse.json({
      message: 'Prompt created successfully',
      prompt
    }, { status: 201 });
  } catch (error) {
    console.error('Create prompt error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}