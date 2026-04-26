import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/db/nebuladb-helper';
import { comparePasswords, createToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { initializeDatabase } from '@/db/nebuladb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as { username: string; password: string };

    console.log('[LOGIN] Attempt for username:', username);

    // Validate input
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure database is initialized
    await initializeDatabase();

    // Get database helper
    const dbHelper = await getNebulaDBHelper();

    // Find user by username
    const user = await dbHelper.getUserByUsername(username);

    console.log('[LOGIN] User found:', user ? 'yes' : 'no', user?.username);
    console.log('[LOGIN] Stored password hash:', user?.password?.substring(0, 20) + '...');
    console.log('[LOGIN] Input password:', password);

    if (!user) {
      console.log('User not found for username:', username);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    console.log('Comparing password...');
    const isPasswordValid = await comparePasswords(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Password comparison failed');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create JWT token
    const token = createToken(user.id);

    // Set cookie
    const cookieStore = cookies();
    cookieStore.set({
      name: 'gemini-auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'strict',
    });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
