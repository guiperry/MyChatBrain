import { db, collections } from '@/database/nebuladb';

import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/database/nebuladb-helper';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('Notes save API called');
  try {
    // Get RxDB helper
    const dbHelper = await getNebulaDBHelper();

    // Temporarily skip authentication for notes - treat all as anonymous
    let userId: number | null = null;
    console.log('Saving as anonymous user');

    // Parse request body
    const { title, content, noteId: noteIdStr } = await request.json();
    console.log('Request data:', {
      title,
      noteId: noteIdStr,
      contentLength: content?.length,
      contentPreview: content?.substring(0, 100)
    });

    let noteId: number | undefined;
    if (noteIdStr) {
      noteId = parseInt(noteIdStr, 10);
      if (isNaN(noteId)) {
        return NextResponse.json(
          { error: 'Invalid note ID' },
          { status: 400 }
        );
      }
    }

    if (!title?.trim()) {
      console.log('Missing required title');
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // If noteId is provided, update existing note
    if (noteId) {
      console.log('Updating existing note with ID:', noteId);

      // Check if the note exists
      const existingNote = await dbHelper.getNote(noteId);
      console.log('Existing note found:', existingNote);

      if (!existingNote) {
        console.log('Note not found or permission denied');
        return NextResponse.json(
          { error: 'Note not found or you do not have permission to edit it' },
          { status: 404 }
        );
      }

      // Update the note
      console.log('Updating note in database');
      try {
        console.log('Executing update with params:', {
          title,
          contentLength: content.length,
          noteId
        });

        await dbHelper.updateNote(noteId, {
          title,
          content
        });

        console.log('Note updated successfully');

        // Verify the update by fetching the note
        const updatedNote = await dbHelper.getNote(noteId);
        console.log('Verified updated note:', {
          id: updatedNote?.id,
          title: updatedNote?.title,
          contentLength: updatedNote?.content?.length,
          contentPreview: updatedNote?.content?.substring(0, 100)
        });
      } catch (dbError) {
        console.error('Database error during update:', dbError);
        throw dbError;
      }

      return NextResponse.json({
        success: true,
        message: 'Note updated successfully',
        noteId
      });
    }
    // Otherwise create a new note
    else {
      console.log('Creating new note');
      try {
        console.log('Executing insert with params:', {
          userId,
          title,
          contentLength: content.length
        });

        const newNote = await dbHelper.createNote({
          title,
          content,
          user_id: userId
        });

        const newNoteId = newNote.id.toString();
        console.log('New note created with ID:', newNoteId);

        // Verify the insert by fetching the note
        const verifiedNote = await dbHelper.getNote(newNoteId);
        console.log('Verified new note:', {
          id: verifiedNote?.id,
          title: verifiedNote?.title,
          contentLength: verifiedNote?.content?.length,
          contentPreview: verifiedNote?.content?.substring(0, 100)
        });

        return NextResponse.json({
          success: true,
          message: 'Note created successfully',
          noteId: newNoteId
        });
      } catch (dbError) {
        console.error('Database error during insert:', dbError);
        throw dbError;
      }
    }
  } catch (error: any) {
    console.error('Error saving note:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save note' },
      { status: 500 }
    );
  }
}
