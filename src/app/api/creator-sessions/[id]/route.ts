import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/db/nebuladb-helper';
import { initializeDatabase } from '@/db/nebuladb';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initializeDatabase();
    const db = await getNebulaDBHelper();
    await db.deleteCreatorSession(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting creator session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
