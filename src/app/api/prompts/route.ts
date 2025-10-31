import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';

// GET /api/prompts - Get all prompts for the current user
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get('gemini-auth-token')?.value;

    let userId: number | null = null;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        userId = decoded.userId;
      }
    }

    // Fetch prompts
    let prompts: any[] = [];
    if (userId) {
      prompts = db.all('SELECT * FROM prompts WHERE user_id = ? OR user_id IS NULL ORDER BY updated_at DESC', [userId]);
    } else {
      prompts = db.all('SELECT * FROM prompts WHERE user_id IS NULL ORDER BY updated_at DESC');
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
      const decoded = verifyToken(token);
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

    // Create the prompt
    const timestamp = new Date().toISOString();
    const result = db.run(
      'INSERT INTO prompts (content, title, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [content, title || null, userId, timestamp, timestamp]
    );

    if (!result.lastInsertRowid) {
      return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
    }

    const promptId = result.lastInsertRowid;
    const prompt = db.get('SELECT * FROM prompts WHERE id = ?', [promptId]);

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
