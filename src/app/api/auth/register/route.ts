import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/database/nebuladb-helper';
import { hashPassword, createToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { initializeDatabase } from '@/db/nebuladb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body as { username: string; email: string; password: string };

    // Validate input with comprehensive checks
    if (!username?.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!password?.trim()) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Ensure database is initialized
    await initializeDatabase();

    // Get database helper
    const dbHelper = await getNebulaDBHelper();

    // Check if username already exists
    const existingUsername = await dbHelper.getUserByUsername(username.trim());
    if (existingUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    // Check if email already exists
    const existingEmail = await dbHelper.getUserByEmail(email.trim().toLowerCase());
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await dbHelper.createUser({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword
    });

    const userId = user.id;

    // Create JWT token
    const token = createToken(userId);

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
    return NextResponse.json({
      user: {
        id: userId,
        username: username.trim(),
        email: email.trim().toLowerCase(),
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
