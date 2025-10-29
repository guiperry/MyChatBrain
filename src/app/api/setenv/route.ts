import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { DecodedToken } from '@/types';
import { typedGet, typedRun } from '@/db/types';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get('gemini-auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({
        error: 'Authentication required',
        details: 'Please login to save settings'
      }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token) as DecodedToken | null;
    if (!decoded) {
      return NextResponse.json({
        error: 'Invalid session',
        details: 'Please login again'
      }, { status: 401 });
    }

    const body = await request.json();
    const { key, value } = body as { key: string; value: string };

    // Validate input
    if (!key) {
      return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
    }

    // Additional validation for API keys
    if (key === 'NEXT_PUBLIC_GOOGLE_API_KEY' && !/^AIza[0-9A-Za-z\-_]{35}$/.test(value)) {
      return NextResponse.json({
        error: 'Invalid Google API key format',
        details: 'Key should start with AIza and be 39 characters long'
      }, { status: 400 });
    }

    // Check if setting already exists
    const existingSetting = typedGet<{ id: number; value: string }>(
      db,
      'SELECT * FROM settings WHERE user_id = ? AND key = ?',
      [decoded.userId, key]
    );

    const timestamp = new Date().toISOString();

    if (existingSetting) {
      // Update existing setting
      typedRun(
        db,
        'UPDATE settings SET value = ?, updated_at = ? WHERE id = ?',
        [value, timestamp, existingSetting.id]
      );
    } else {
      // Create new setting
      typedRun(
        db,
        'INSERT INTO settings (user_id, key, value, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [decoded.userId, key, value, timestamp, timestamp]
      );
    }

    return NextResponse.json({ message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Set setting error:', error);
    
    // Provide more specific error messages for debugging
    if (error instanceof Error) {
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        return NextResponse.json({
          error: 'Database constraint error: The user may not exist or was deleted',
          details: error.message
        }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}