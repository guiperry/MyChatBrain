import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/database/nebuladb-helper';

export async function GET(request: NextRequest) {
  try {
    // Get NebulaDB helper instance to verify database connectivity
    const dbHelper = await getNebulaDBHelper();

    // Simple database check - try to get chat sessions
    const sessions = await dbHelper.getChatSessions();
    const sessionCount = sessions.length;

    // Get collection information
    const collections = Object.keys(require('@/database/nebuladb').collections);

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'nebuladb_connected',
      collections,
      sessionCount
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
