import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
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
    let deleteResult;
    if (userId) {
      console.log('Deleting all notes for user ID:', userId);
      deleteResult = db.run('DELETE FROM notes WHERE user_id = ?', [userId]);
    } else {
      console.log('Deleting all anonymous notes');
      deleteResult = db.run('DELETE FROM notes WHERE user_id IS NULL');
    }

    console.log('Delete result:', deleteResult);

    return NextResponse.json({
      success: true,
      message: 'All notes deleted successfully',
      deletedCount: deleteResult.changes
    });
  } catch (error: any) {
    console.error('Error deleting notes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete notes' },
      { status: 500 }
    );
  }
}
