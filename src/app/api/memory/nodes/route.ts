import { NextRequest, NextResponse } from 'next/server';
import { getRxDBHelper } from '@/db/rxdb';
import { getCurrentUser } from '@/lib/auth';
import { storeNodeVector, deleteNodeVector } from '@/lib/memoryVectors';

// GET /api/memory/nodes - Get a specific node or all nodes
export async function GET(req: NextRequest) {
  try {
    // Get RxDB helper
    const rxdbHelper = await getRxDBHelper();

    // Get the current user session
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the session - for now we'll use null for anonymous access
    // TODO: Update this when user authentication is properly integrated with RxDB
    const userId = null; // user.id is not available in the expected format

    // Get the node ID from the query parameters
    const url = new URL(req.url);
    const nodeId = url.searchParams.get('id');

    let nodes;
    if (nodeId) {
      // Get a specific node
      const node = await rxdbHelper.getMemoryNode(parseInt(nodeId));
      nodes = node ? [node] : [];
    } else {
      // Get all nodes for the user
      nodes = await rxdbHelper.getMemoryNodes(userId);
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
    // Get RxDB helper
    const rxdbHelper = await getRxDBHelper();

    // Get the current user session
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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

    // Get the existing node
    const existingNode = await rxdbHelper.getMemoryNode(parseInt(id));
    if (!existingNode) {
      return NextResponse.json(
        { success: false, error: 'Node not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Partial<{ label: string; type: 'keyword' | 'entity' | 'message' | 'topic' | 'custom'; metadata: string }> = {};

    if (label !== undefined) {
      updateData.label = label;
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
      updateData.type = type;
    }

    if (metadata !== undefined) {
      updateData.metadata = JSON.stringify(metadata);
    }

    // Update the node (RxDB handles the ID and timestamps automatically)
    const updatedNode = await rxdbHelper.updateMemoryNode(parseInt(id), updateData);

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
    // Get RxDB helper
    const rxdbHelper = await getRxDBHelper();

    // Get the current user session
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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

    // Verify that the node exists
    const existingNode = await rxdbHelper.getMemoryNode(parseInt(nodeId));
    if (!existingNode) {
      return NextResponse.json(
        { success: false, error: 'Node not found' },
        { status: 404 }
      );
    }

    // Delete the node
    await rxdbHelper.deleteMemoryNode(parseInt(nodeId));

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
