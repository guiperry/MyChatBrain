import { NextRequest, NextResponse } from 'next/server';
import { getRxDB } from '@/db/rxdb';

export async function GET(request: NextRequest) {
  try {
    console.log('Checking RxDB database status...');

    // Initialize RxDB to ensure collections exist
    const db = await getRxDB();

    console.log('RxDB database initialized successfully');

    return NextResponse.json({
      message: 'RxDB database initialized successfully',
      collections: Object.keys(db.collections)
    }, { status: 200 });
  } catch (error) {
    console.error('Error initializing RxDB database:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
