import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import type { MemoryNodes, Users } from '@/db/schema';

interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
}
import { findRelatedNodes } from '@/lib/memoryVectors';

// GET /api/memory/related - Find semantically related nodes
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

    // Get the node ID from the URL
    const url = new URL(req.url);
    const nodeId = url.searchParams.get('id');
    if (!nodeId) {
      return NextResponse.json(
        { success: false, error: 'Node ID is required' },
        { status: 400 }
      );
    }

    // Verify that the node exists and belongs to the user
    const node = await db.get(
      'SELECT id FROM memory_nodes WHERE id = ? AND user_id = ?',
      [nodeId, dbUser.id]
    ) as MemoryNodes | null;
    if (!node) {
      return NextResponse.json(
        { success: false, error: 'Node not found or does not belong to the user' },
        { status: 404 }
      );
    }

    // Get the limit and threshold from the URL (optional)
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    const threshold = parseFloat(url.searchParams.get('threshold') || '0.75');

    // Find related nodes
    const { success, results, error } = await findRelatedNodes(
      nodeId,
      dbUser.id.toString(),
      limit,
      threshold
    );

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to find related nodes' },
        { status: 500 }
      );
    }

    // Get the full node details from the database
    const relatedNodes = [];
    for (const result of results || []) {
      if (result.nodeId) {
        const relatedNode = await db.get(
          'SELECT id, label, type, metadata, created_at, updated_at FROM memory_nodes WHERE id = ?',
          [result.nodeId]
        ) as MemoryNodes | null;

        if (relatedNode && relatedNode.id && relatedNode.label && relatedNode.type) {
          relatedNodes.push({
            id: relatedNode.id?.toString() ?? '',
            label: relatedNode.label ?? '',
            type: relatedNode.type ?? 'custom',
            metadata: relatedNode.metadata ? JSON.parse(relatedNode.metadata) : {},
            createdAt: relatedNode.created_at ?? new Date().toISOString(),
            updatedAt: relatedNode.updated_at ?? new Date().toISOString(),
            similarity: result.similarity
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      relatedNodes
    });
  } catch (error) {
    console.error('Error finding related nodes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to find related nodes' },
      { status: 500 }
    );
  }
}