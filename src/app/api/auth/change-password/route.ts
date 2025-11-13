import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken, comparePasswords, hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';
import { DecodedToken } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get('gemini-auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token) as DecodedToken | null;
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body as { currentPassword: string; newPassword: string };

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get RxDB helper instance
    const NebulaDBHelper = await db();

    // Get user with password
    const user = await NebulaDBHelper.getUser(Number(decoded.userId));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await comparePasswords(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password using RxDB
    await NebulaDBHelper.updateUser(Number(decoded.userId).toString(), {
      password: hashedPassword
    });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}