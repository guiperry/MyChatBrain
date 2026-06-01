import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getCollections } from '@/db/nebuladb';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await initializeDatabase();
    const cols = await getCollections();
    const setting = await (cols as any).settings.findOne({
      key: 'reset_token',
      value: token
    });

    if (!setting) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    if (new Date(setting.updated_at) < new Date()) {
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await (cols as any).users.update(
      { id: setting.user_id },
      { $set: { password: hashedPassword, updated_at: new Date().toISOString() } }
    );

    await (cols as any).settings.delete({ user_id: setting.user_id, key: 'reset_token' });

    return NextResponse.json({ success: true, message: 'Password has been reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
