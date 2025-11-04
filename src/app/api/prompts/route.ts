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

    // Get RxDB helper instance
    const rxdbHelper = await db();

    // Fetch prompts
    const prompts = await rxdbHelper.getPrompts(userId);

    return NextResponse.json({
      prompts: prompts.map(p => p.toJSON())
    });
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

    // Get RxDB helper instance
    const rxdbHelper = await db();

    // Create the prompt
    const prompt = await rxdbHelper.createPrompt({
      content,
      title: title || null,
      user_id: userId
    });

    return NextResponse.json({
      message: 'Prompt created successfully',
      prompt: prompt.toJSON()
    }, { status: 201 });
  } catch (error) {
    console.error('Create prompt error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
