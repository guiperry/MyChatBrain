import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { typedGet, typedAll } from '@/db/types';

export async function GET(request: NextRequest) {
  try {
    // Simple database check - just verify we can run a query
    const result = typedGet<{ health: number }>(db, 'SELECT 1 as health');

    // Get schema information
    const tables = typedAll<{ name: string }>(
      db,
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
    );

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      result,
      tables: tables.map(t => t.name)
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