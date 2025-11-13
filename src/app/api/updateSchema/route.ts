import { db, collections } from '@/database/nebuladb';

import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/database/nebuladb-helper';

export async function GET(request: NextRequest) {
  try {
    console.log('Checking NebulaDB database status...');

    // Initialize NebulaDB to ensure collections exist
    const dbHelper = await getNebulaDBHelper();

    console.log('NebulaDB database initialized successfully');

    return NextResponse.json({
      message: 'NebulaDB database initialized successfully',
      collections: Object.keys(collections)
    }, { status: 200 });
  } catch (error) {
    console.error('Error initializing NebulaDB database:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
