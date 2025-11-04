import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  console.log('Notes load API called');
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

    // Get RxDB helper instance
    const rxdbHelper = await db();

    // Fetch notes
    const notes = await rxdbHelper.getNotes(userId);

    console.log(`Found ${notes.length} notes`);

    // For debugging, log the first few notes with content details
    if (notes.length > 0) {
      console.log('Sample notes:', notes.slice(0, 2).map(note => ({
        id: note.id,
        title: note.title,
        contentLength: note.content?.length,
        contentPreview: note.content?.substring(0, 100),
        created_at: note.created_at,
        updated_at: note.updated_at
      })));
    }

    return NextResponse.json({
      success: true,
      notes: notes.map(n => n.toJSON())
    });
  } catch (error: any) {
    console.error('Error loading notes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load notes' },
      { status: 500 }
    );
  }
}
