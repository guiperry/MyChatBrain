import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { Notes } from '@/db/schema';

// GET /api/notes/[id] - Get a specific note by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`Notes get by ID API called for note ID: ${params.id}`);
  try {
    const noteId = parseInt(params.id, 10);
    if (isNaN(noteId)) {
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
    }

    // Temporarily skip authentication for notes - treat all as anonymous
    console.log(`Fetching note with ID: ${noteId}`);

    // Fetch the note
    const note = db.get(
      'SELECT * FROM notes WHERE id = ?',
      [noteId]
    ) as Notes | undefined;
    console.log('Fetched note:', note);

    if (!note) {
      console.log('Note not found');
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    console.log('Note found:', {
      id: note.id,
      title: note.title,
      contentLength: note.content?.length,
      contentPreview: note.content?.substring(0, 100)
    });

    return NextResponse.json({
      success: true,
      note
    });
  } catch (error: any) {
    console.error('Error fetching note:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch note' },
      { status: 500 }
    );
  }
}

// DELETE /api/notes/[id] - Delete a specific note by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`Notes delete API called for note ID: ${params.id}`);
  try {
    const noteId = parseInt(params.id, 10);
    console.log('Parsed noteId:', noteId);
    if (isNaN(noteId)) {
      console.log('Invalid noteId, returning 400');
      return NextResponse.json({ error: 'Invalid note ID' }, { status: 400 });
    }

    // Temporarily skip authentication for notes - treat all as anonymous
    console.log('Checking for note with ID:', noteId);

    // Check if the note exists
    const existingNote = db.get(
      'SELECT * FROM notes WHERE id = ?',
      [noteId]
    ) as Notes | undefined;
    console.log('Note found:', existingNote);

    if (!existingNote) {
      console.log('Note not found, returning 404');
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }
    console.log('Note found, proceeding to delete');

    // Delete the note
    console.log('Deleting note from database');
    const deleteResult = db.run('DELETE FROM notes WHERE id = ?', [noteId]);
    console.log('Delete result:', deleteResult);

    // Verify deletion
    const checkDeleted = db.get('SELECT * FROM notes WHERE id = ?', [noteId]);
    console.log('Note after delete:', checkDeleted);

    console.log('Returning success response');
    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to delete note' },
      { status: 500 }
    );
  }
}
