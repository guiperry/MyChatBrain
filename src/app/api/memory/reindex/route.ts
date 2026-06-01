import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { initializeDatabase } from '@/db/nebuladb';
import { reindexUserData } from '@/lib/embeddingIndex';

export async function POST(_request: NextRequest) {
  try {
    const token = cookies().get('gemini-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userId = decoded.userId.toString();

    await initializeDatabase();
    const { indexed, errors } = await reindexUserData(userId);

    return NextResponse.json({ success: true, indexed, errors });
  } catch (error) {
    console.error('Reindex error:', error);
    return NextResponse.json({ error: 'Reindex failed' }, { status: 500 });
  }
}
