import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase, getCollections } from '@/db/nebuladb';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await initializeDatabase();
    const cols = await getCollections();
    const user = await (cols as any).users.findOne({ email });

    const resetToken = crypto.randomUUID();
    const resetExpires = new Date(Date.now() + 3600000).toISOString();

    if (user) {
      const existing = await (cols as any).settings.findOne({
        user_id: user.id,
        key: 'reset_token'
      });
      if (existing) {
        await (cols as any).settings.update(
          { user_id: user.id, key: 'reset_token' },
          { $set: { value: resetToken, updated_at: resetExpires } }
        );
      } else {
        await (cols as any).settings.insert({
          user_id: user.id, key: 'reset_token',
          value: resetToken, created_at: resetExpires, updated_at: resetExpires
        });
      }
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/reset-password?token=${resetToken}`;
    console.log(`Password reset link for ${email}: ${resetUrl}`);

    return NextResponse.json({
      success: true,
      message: 'If that email is registered, a reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
