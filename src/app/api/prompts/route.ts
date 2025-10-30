import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRxDBHelper } from '@/db/rxdb';
import { verifyToken } from '@/lib/auth';
import { DecodedToken } from '@/types';

// GET /api/prompts - Get all prompts for the current user
export async function GET(request: NextRequest) {
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

    // Fetch prompts
    const prompts = await rxdbHelper.getPrompts(userId);

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Error loading prompts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/prompts - Create a new prompt
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
    const { content, title } = body as { content: string; title?: string };

    // Validate input
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Create the prompt
    const prompt = await rxdbHelper.createPrompt({
      content,
      title: title || null,
      user_id: userId
    });

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
