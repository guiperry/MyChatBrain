import { db, collections } from '@/database/nebuladb';

import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/database/nebuladb-helper';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { findRelatedNodes } from '@/lib/memoryVectors';

interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
}

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
    const dbHelper = await getNebulaDBHelper();
    const dbUser = await dbHelper.getUserByEmail(userEmail);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get the node ID from the URL
    const url = new URL(req.url);
    const nodeId = url.searchParams.get('nodeId');
    if (!nodeId) {
      return NextResponse.json({ success: false, error: 'Missing nodeId parameter' }, { status: 400 });
    }

    // Get the node from the database
    const node = await dbHelper.getMemoryNode(parseInt(nodeId));
    if (!node) {
      return NextResponse.json({ success: false, error: 'Node not found' }, { status: 404 });
    }

    // Find related nodes using vector similarity
    const relatedNodesResult = await findRelatedNodes(node.id.toString(), dbUser.id.toString());

    // Format the response
    const response = {
      success: true,
      data: {
        node: {
          id: node.id,
          label: node.label,
          type: node.type,
          metadata: node.metadata,
          createdAt: node.created_at,
          updatedAt: node.updated_at,
        },
        relatedNodes: relatedNodesResult.success ? (relatedNodesResult.results?.map((relatedNode: any) => ({
          id: relatedNode.id,
          label: relatedNode.label,
          type: relatedNode.type,
          metadata: relatedNode.metadata,
          similarity: relatedNode.similarity,
          createdAt: relatedNode.created_at,
          updatedAt: relatedNode.updated_at,
        })) || []) : [],
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error finding related nodes:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}