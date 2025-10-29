import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { hashPassword, createToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { DbUser } from '@/types';
import { typedGet, typedRun } from '@/db/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body as { username: string; email: string; password: string };

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if username or email already exists
    const existingUser = typedGet<DbUser>(
      db,
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
      if (existingUser.email === email) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const timestamp = new Date().toISOString();

    typedRun(
      db,
      `INSERT INTO users (username, email, password, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, timestamp, timestamp]
    );

    // Get the newly created user
    const newUser = typedGet<DbUser>(
      db,
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!newUser) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create JWT token
    const token = createToken(newUser.id);

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
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}