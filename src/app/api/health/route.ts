import { NextRequest, NextResponse } from 'next/server';
import { getRxDBHelper } from '@/db/rxdb';

export async function GET(request: NextRequest) {
  try {
    // Get RxDB helper instance to verify database connectivity
    const rxdbHelper = await getRxDBHelper();

    // Simple database check - try to get chat sessions
    const sessions = await rxdbHelper.getChatSessions();
    const sessionCount = sessions.length;

    // Get collection information
    const db = await rxdbHelper['db']; // Access the underlying RxDB instance
    const collections = Object.keys(db.collections);

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'rxdb_connected',
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
