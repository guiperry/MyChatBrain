import { NextRequest, NextResponse } from 'next/server';
import { getRxDBHelper } from '@/db/rxdb';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  console.log('Notes load API called');
  try {
    // Get RxDB helper
    const rxdbHelper = await getRxDBHelper();

    // Temporarily skip authentication for notes - treat all as anonymous
    console.log('Fetching all notes as anonymous');

    // Fetch notes
    let userNotes = [];

    try {
      // Fetch all notes (anonymous notes)
      userNotes = await rxdbHelper.getNotes(null);

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
