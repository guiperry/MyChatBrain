import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { Notes } from '@/db/schema';

export async function GET(request: NextRequest) {
  console.log('Notes load API called');
  try {
    // Temporarily skip authentication for notes - treat all as anonymous
    console.log('Fetching all notes as anonymous');

    // Fetch notes
    let userNotes: Notes[] = [];

    try {
      // Fetch all notes (anonymous notes)
      userNotes = db.all(
        'SELECT * FROM notes WHERE user_id IS NULL ORDER BY updated_at DESC'
      ) as Notes[];

      // Check for and remove any duplicate notes (by ID)
      // Use a Map to ensure we only have one note per ID
      const notesMap = new Map<string, Notes>();

      userNotes.forEach(note => {
        // Make sure we have valid IDs
        if (note.id === undefined) {
          console.warn('Found note with undefined ID, skipping');
          return;
        }

        const noteId = note.id.toString();

        // Always use the most recently updated version of a note
        if (!notesMap.has(noteId) ||
            new Date(note.updated_at) > new Date(notesMap.get(noteId)!.updated_at)) {
          notesMap.set(noteId, note);
        }
      });

      // Convert the Map back to an array
      userNotes = Array.from(notesMap.values());

      console.log(`After deduplication: ${userNotes.length} unique notes`);

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
