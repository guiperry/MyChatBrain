import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { DecodedToken } from '@/types';
import { typedGet, typedRun } from '@/db/types';
import { Prompt } from '@/db/types';

// GET /api/prompts/[id] - Get a specific prompt
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const promptId = parseInt(params.id);
    if (isNaN(promptId)) {
      return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400 });
    }

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

    // Fetch the prompt
    const prompt = typedGet<Prompt>(
      db,
      'SELECT * FROM prompts WHERE id = ?',
      [promptId]
    );

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Check if the user has access to this prompt
    if (prompt.user_id !== null && prompt.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Error getting prompt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/prompts/[id] - Update a specific prompt
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const promptId = parseInt(params.id);
    if (isNaN(promptId)) {
      return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400 });
    }

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

    // Fetch the prompt to check ownership
    const existingPrompt = typedGet<Prompt>(
      db,
      'SELECT * FROM prompts WHERE id = ?',
      [promptId]
    );

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Check if the user has access to this prompt
    if (existingPrompt.user_id !== null && existingPrompt.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get the updated data
    const body = await request.json();
    const { content, title } = body as { content: string; title?: string };

    // Validate input
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Update the prompt
    const timestamp = new Date().toISOString();
    typedRun(
      db,
      `UPDATE prompts 
       SET content = ?, title = ?, updated_at = ? 
       WHERE id = ?`,
      [content, title || null, timestamp, promptId]
    );

    // Get the updated prompt
    const updatedPrompt = typedGet<Prompt>(
      db,
      'SELECT * FROM prompts WHERE id = ?',
      [promptId]
    );

    return NextResponse.json({
      message: 'Prompt updated successfully',
      prompt: updatedPrompt
    });
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/prompts/[id] - Delete a specific prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const promptId = parseInt(params.id);
    if (isNaN(promptId)) {
      return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400 });
    }

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

    // Fetch the prompt to check ownership
    const existingPrompt = typedGet<Prompt>(
      db,
      'SELECT * FROM prompts WHERE id = ?',
      [promptId]
    );

    if (!existingPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Check if the user has access to this prompt
    if (existingPrompt.user_id !== null && existingPrompt.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the prompt
    typedRun(
      db,
      'DELETE FROM prompts WHERE id = ?',
      [promptId]
    );

    return NextResponse.json({
      message: 'Prompt deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}