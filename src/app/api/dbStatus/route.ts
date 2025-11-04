import { NextRequest, NextResponse } from 'next/server';
import { getRxDBHelper } from '@/db/rxdb';

export async function GET(request: NextRequest) {
  try {
    console.log('Checking RxDB status...');

    let collections: string[] = [];
    let recordCounts: Record<string, number> = {};
    let error = null;

    try {
      // Get RxDB helper instance
      const rxdbHelper = await getRxDBHelper();

      // Get the underlying RxDB instance
      const db = await rxdbHelper['db'];

      // Get collection names
      collections = Object.keys(db.collections);

      // Get record counts for each collection
      for (const collectionName of collections) {
        try {
          const collection = (db.collections as any)[collectionName];
          const docs = await collection.find().exec();
          recordCounts[collectionName] = docs.length;
        } catch (err) {
          recordCounts[collectionName] = -1; // Error getting count
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    // Return the database status
    return NextResponse.json({
      status: 'success',
      database: {
        type: 'RxDB',
        storage: 'memory', // Based on rxdb.ts configuration
        collections,
        recordCounts,
        error
      }
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
