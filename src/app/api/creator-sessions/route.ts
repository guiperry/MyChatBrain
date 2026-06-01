import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/db/nebuladb-helper';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { initializeDatabase } from '@/db/nebuladb';

export async function GET() {
  try {
    const token = cookies().get('gemini-auth-token')?.value;
    const decoded = token ? verifyToken(token) : null;
    await initializeDatabase();
    const db = await getNebulaDBHelper();
    const sessions = await db.getCreatorSessions(decoded?.userId ?? 0);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error listing creator sessions:', error);
    return NextResponse.json({ error: 'Failed to list sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = cookies().get('gemini-auth-token')?.value;
    const decoded = token ? verifyToken(token) : null;
    const body = await request.json();
    await initializeDatabase();
    const db = await getNebulaDBHelper();

    const session = await db.upsertCreatorSession({
      ...body,
      user_id: (decoded?.userId ?? 0).toString(),
      updatedAt: new Date().toISOString()
    });
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Error upserting creator session:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}
