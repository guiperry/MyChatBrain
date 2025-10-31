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

    // Fetch notes
    let userNotes: any[] = [];

    try {
      // Fetch notes for user or all notes if no user
      if (userId) {
        userNotes = db.all('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
      } else {
        userNotes = db.all('SELECT * FROM notes ORDER BY updated_at DESC');
      }

      console.log(`Found ${userNotes.length} notes`);

      // For debugging, log the first few notes with content details
      if (userNotes.length > 0) {
        console.log('Sample notes:', userNotes.slice(0, 2).map(note => ({
          id: note.id,
          title: note.title,
          contentLength: note.content?.length,
          contentPreview: note.content?.substring(0, 100),
          created_at: note.created_at,
          updated_at: note.updated_at
        })));
      }
    } catch (dbError) {
      console.error('Database error fetching notes:', dbError);
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      notes: userNotes
    });
  } catch (error: any) {
    console.error('Error loading notes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load notes' },
      { status: 500 }
    );
  }
}
