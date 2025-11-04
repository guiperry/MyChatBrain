import { NextRequest, NextResponse } from 'next/server';
import { getRxDBHelper } from '@/db/rxdb';
import { comparePasswords, createToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as { username: string; password: string };

    // Validate input
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get RxDB helper
    const rxdbHelper = await getRxDBHelper();

    // Find user by username
    const user = await rxdbHelper.getUserByUsername(username);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create JWT token
    const token = createToken(parseInt(user.id));

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
    const userData = user.toJSON();
    const { password: _, ...userWithoutPassword } = userData;
    return NextResponse.json({
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
