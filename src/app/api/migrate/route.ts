import { db, collections } from '@/database/nebuladb';

import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/database/nebuladb-helper';

export async function POST(request: NextRequest) {
  console.log('Migration API called');

  try {
    // Get RxDB helper
    const dbHelper = await getNebulaDBHelper();

    console.log('RxDB migration endpoint - database is already using RxDB');

    // Check if we have any data in RxDB
    const users = await dbHelper.getChatSessions();
    const hasData = users.length > 0;

    return NextResponse.json({
      success: true,
      message: 'Application is already using RxDB',
      hasData,
      note: 'SQLite migration is handled by the dedicated migration script: npm run migrate-to-rxdb'
    });

  } catch (error: any) {
    console.error('Migration check failed:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Migration check failed',
        error: error.toString()
      },
      { status: 500 }
    );
  }
}
