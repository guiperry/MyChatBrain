import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { findSimilarNodes } from '@/lib/memoryVectors';
import type { MemoryNodes, Users } from '@/db/schema';

interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
}

// GET /api/memory/search - Search for nodes semantically
export async function GET(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    const user = session?.user as AuthenticatedUser | null;
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the session
    const userEmail = user.email;
    const dbUser = await db.get(
      'SELECT id FROM users WHERE email = ?',
      [userEmail]
    ) as Users | null;
    if (!dbUser?.id) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get the query from the URL
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Get the limit and threshold from the URL (optional)
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const threshold = parseFloat(url.searchParams.get('threshold') || '0.7');

    // Search for similar nodes
    const { success, results, error } = await findSimilarNodes(
      query,
      dbUser.id.toString(),
      limit,
      threshold
    );

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to search for nodes' },
        { status: 500 }
      );
    }

    // Get the full node details from the database
    const nodes = [];
    for (const result of results || []) {
      if (result.nodeId) {
        const node = await db.get(
          'SELECT id, label, type, metadata, created_at, updated_at FROM memory_nodes WHERE id = ?',
          [result.nodeId]
        ) as MemoryNodes | null;

        if (node && node.id && node.label && node.type) {
          nodes.push({
            id: node.id?.toString() ?? '',
            label: node.label ?? '',
            type: node.type ?? 'custom',
            metadata: node.metadata ? JSON.parse(node.metadata) : {},
            createdAt: node.created_at ?? new Date().toISOString(),
            updatedAt: node.updated_at ?? new Date().toISOString(),
            similarity: result.similarity
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      nodes
    });
  } catch (error) {
    console.error('Error searching memory nodes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search memory nodes' },
      { status: 500 }
    );
  }
}