import { db, collections } from '@/database/nebuladb';

import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/database/nebuladb-helper';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
  console.log('Notes delete all API called');
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get('gemini-auth-token')?.value;
    console.log('Token found:', !!token);

    // Verify token and get user ID
    let userId: number | null = null;
    if (token) {
      try {
        const payload = verifyToken(token);
        if (payload) {
          userId = payload.userId;
          console.log('User authenticated, userId:', userId);
        } else {
          console.log('Token verification returned null payload');
        }
      } catch (error) {
        console.error('Invalid token:', error);
        // Continue as anonymous user
      }
    } else {
      console.log('No token found, continuing as anonymous user');
    }

    // Delete all notes for the user
    const dbHelper = await getNebulaDBHelper();
    let deleteResult;
    if (userId) {
      console.log('Deleting all notes for user ID:', userId);
      // Get all notes for the user and delete them one by one
      const userNotes = await dbHelper.getNotes(userId);
      for (const note of userNotes) {
        await dbHelper.deleteNote(parseInt(note.id));
      }
      deleteResult = { success: true, count: userNotes.length };
    } else {
      console.log('Deleting all anonymous notes');
      // Get all anonymous notes and delete them one by one
      const anonymousNotes = await dbHelper.getNotes(null);
      for (const note of anonymousNotes) {
        await dbHelper.deleteNote(parseInt(note.id));
      }
      deleteResult = { success: true, count: anonymousNotes.length };
    }

    console.log('Delete result:', deleteResult);

    return NextResponse.json({
      success: true,
      message: 'All notes deleted successfully',
      deletedCount: deleteResult.count
    });
  } catch (error: any) {
    console.error('Error deleting notes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete notes' },
      { status: 500 }
    );
  }
}
