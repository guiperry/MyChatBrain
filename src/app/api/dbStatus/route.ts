import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/database/nebuladb-helper';

export async function GET(request: NextRequest) {
  try {
    console.log('Checking NebulaDB status...');

    let collections: string[] = [];
    let recordCounts: Record<string, number> = {};
    let error = null;

    try {
      // Get NebulaDB helper instance
      const nebulaHelper = await getNebulaDBHelper();

      // Get collection names from the collections object
      collections = Object.keys(require('@/database/nebuladb').collections);

      // Get record counts for each collection
      for (const collectionName of collections) {
        try {
          const collection = (require('@/database/nebuladb').collections as any)[collectionName];
          // For NebulaDB, we might need to use a different method to count
          // Since we don't have a direct count method, we'll try to get all and count
          const docs = await collection.find().toArray();
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
        type: 'NebulaDB',
        storage: 'filesystem', // Based on nebuladb.ts configuration
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
