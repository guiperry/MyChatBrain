import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/db/nebuladb-helper';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { initializeDatabase } from '@/db/nebuladb';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get('gemini-auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Ensure database is initialized
    await initializeDatabase();

    // Get database helper instance
    const dbHelper = await getNebulaDBHelper();

    // Get user data from database
    const user = await dbHelper.getUser(decoded.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
