import { db } from '@/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { DbUser } from '../types';

// JWT secret key - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Compare a password with a hash
export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create a JWT token
export function createToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Verify a JWT token
export function verifyToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded;
  } catch (error) {
    return null;
  }
}

// Get the current user from a request
export async function getCurrentUser(req: NextRequest): Promise<any> {
  const cookieStore = cookies();
  const token = cookieStore.get('gemini-auth-token')?.value;

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  const user = await db.get(
    'SELECT * FROM users WHERE id = ?',
    [decoded.userId]
  ) as DbUser | null;

  if (!user) {
    return null;
  }

  // Don't return the password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Middleware to protect routes
export async function authMiddleware(req: NextRequest): Promise<NextResponse | null> {
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return null;
}

// Logout a user
export function logout(): void {
  const cookieStore = cookies();
  cookieStore.delete('gemini-auth-token');
}

