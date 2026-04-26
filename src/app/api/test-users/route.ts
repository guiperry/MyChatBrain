import { NextResponse } from 'next/server';
import { collections, initializeDatabase } from '@/db/nebuladb';

export async function GET() {
  try {
    // Force initialization first
    await initializeDatabase();
    const users = await collections.users.find().toArray();
    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}