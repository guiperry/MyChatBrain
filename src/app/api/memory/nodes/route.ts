import { NextRequest, NextResponse } from 'next/server';
import { MemoryNodes } from '@/db/schema';
import { db } from '@/db';
import { getCurrentUser } from '@/lib/auth';
import { storeNodeVector, deleteNodeVector } from '@/lib/memoryVectors';

// GET /api/memory/nodes - Get a specific node or all nodes
export async function GET(req: NextRequest) {
  try {
    // Get the current user session
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the session
    const userEmail = user.email;
    const dbUser: { id: number } = db.get('SELECT id FROM users WHERE email = ?', [userEmail]) as any;
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get the node ID from the query parameters
    const url = new URL(req.url);
    const nodeId = url.searchParams.get('id');

    let nodes;
    if (nodeId) {
      // Get a specific node
      nodes = db.all(
        'SELECT id, label, type, metadata, created_at, updated_at FROM memory_nodes WHERE id = ? AND user_id = ?',
        [nodeId, dbUser.id]
      );
    } else {
      // Get all nodes for the user
      nodes = db.all(
        'SELECT id, label, type, metadata, created_at, updated_at FROM memory_nodes WHERE user_id = ?',
        [dbUser.id]
      );
    }

    // Format the response
    const formattedNodes = nodes.map((node: any) => ({
      id: node.id.toString(),
      label: node.label,
      type: node.type,
      metadata: node.metadata ? JSON.parse(node.metadata) : {},
      createdAt: node.created_at,
      updatedAt: node.updated_at
    }));

    return NextResponse.json({
      success: true,
      nodes: formattedNodes
    });
  } catch (error) {
    console.error('Error fetching memory nodes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch memory nodes' },
      { status: 500 }
    );
  }
}

// PUT /api/memory/nodes - Update a node
export async function PUT(req: NextRequest) {
  try {
    // Get the current user session
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the session
    const userEmail = user.email;
    const dbUser = db.get('SELECT id FROM users WHERE email = ?', [userEmail]);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Parse the request body
    const body = await req.json();
    const { id, label, type, metadata } = body;

    // Validate the request
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Node ID is required' },
        { status: 400 }
      );
    }

    // Verify that the node exists and belongs to the user
    // @ts-ignore
    const node = db.get('SELECT id FROM memory_nodes WHERE id = ? AND user_id = ?', [id, dbUser.id]) as MemoryNodes;
    if (!node) {
      return NextResponse.json(
        { success: false, error: 'Node not found or does not belong to the user' },
        { status: 404 }
      );
    }

    // Build the update query
    let updateQuery = 'UPDATE memory_nodes SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (label !== undefined) {
      updateQuery += ', label = ?';
      params.push(label);
    }

    if (type !== undefined) {
      // Validate the node type
      const validTypes = ['keyword', 'entity', 'message', 'topic', 'custom'];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { success: false, error: `Type must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
      updateQuery += ', type = ?';
      params.push(type);
    }

    if (metadata !== undefined) {
      updateQuery += ', metadata = ?';
      params.push(JSON.stringify(metadata));
    }

    // Add the WHERE clause
    updateQuery += ' WHERE id = ?';
    params.push(id);

    // Execute the update
    db.run(updateQuery, params);

    // Get the updated node
    const updatedNode: any = db.get('SELECT * FROM memory_nodes WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      node: {
        id: updatedNode.id.toString(),
        label: updatedNode.label,
        type: updatedNode.type,
        metadata: updatedNode.metadata ? JSON.parse(updatedNode.metadata) : {},
        createdAt: updatedNode.created_at,
        updatedAt: updatedNode.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating memory node:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update memory node' },
      { status: 500 }
    );
  }
}

// DELETE /api/memory/nodes - Delete a node
export async function DELETE(req: NextRequest) {
  try {
    // Get the current user session
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the session
    const userEmail = user.email;
    const dbUser = db.get('SELECT id FROM users WHERE email = ?', [userEmail]);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get the node ID from the query parameters
    const url = new URL(req.url);
    const nodeId = url.searchParams.get('id');
    if (!nodeId) {
      return NextResponse.json(
        { success: false, error: 'Node ID is required' },
        { status: 400 }
      );
    }

    // Verify that the node exists and belongs to the user
    // Verify that the node exists and belongs to the user
    // @ts-ignore
    const node = db.get('SELECT id FROM memory_nodes WHERE id = ? AND user_id = ?', [nodeId, dbUser.id]) as MemoryNodes;
    if (!node) {
      return NextResponse.json(
        { success: false, error: 'Node not found or does not belong to the user' },
        { status: 404 }
      );
    }

    // Delete the node (edges will be deleted automatically due to ON DELETE CASCADE)
    db.run('DELETE FROM memory_nodes WHERE id = ?', [nodeId]);

    // Also delete from vector database
    await deleteNodeVector(nodeId);

    return NextResponse.json({
      success: true,
      message: 'Node deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting memory node:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete memory node' },
      { status: 500 }
    );
  }
}