import { db, collections } from '@/database/nebuladb';

import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/database/nebuladb-helper';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { storeNodeVector } from '@/lib/memoryVectors';

// GET /api/memory - Get the memory graph for the current user
export async function GET(req: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get('gemini-auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the token
    const userId = decoded.userId;

    // Get RxDB helper instance
    const dbHelper = await getNebulaDBHelper();

    // Get all nodes for the user
    const nodes = await dbHelper.getMemoryNodes(userId);

    // Get all edges
    const edges = await dbHelper.getMemoryEdges();

    // Filter edges to only include those connected to user's nodes
    const userNodeIds = new Set(nodes.map((node: any) => parseInt(node.id)));
    const userEdges = edges.filter((edge: any) =>
      userNodeIds.has(edge.source_id) && userNodeIds.has(edge.target_id)
    );

    // Format the response
    const formattedNodes = nodes.map((node: any) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      metadata: node.metadata ? JSON.parse(node.metadata) : {},
      createdAt: node.created_at,
      updatedAt: node.updated_at
    }));

    const formattedEdges = userEdges.map((edge: any) => ({
      id: edge.id,
      source: edge.source_id.toString(),
      target: edge.target_id.toString(),
      relation: edge.relation,
      weight: edge.weight,
      metadata: edge.metadata ? JSON.parse(edge.metadata) : {},
      createdAt: edge.created_at,
      updatedAt: edge.updated_at
    }));

    return NextResponse.json({
      success: true,
      graph: {
        nodes: formattedNodes,
        edges: formattedEdges
      }
    });
  } catch (error) {
    console.error('Error fetching memory graph:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch memory graph' },
      { status: 500 }
    );
  }
}

// POST /api/memory - Create a new node in the memory graph
export async function POST(req: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get('gemini-auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the token
    const userId = decoded.userId;

    // Parse the request body
    const body = await req.json();
    const { label, type, metadata } = body;

    // Validate the request
    if (!label || !type) {
      return NextResponse.json(
        { success: false, error: 'Label and type are required' },
        { status: 400 }
      );
    }

    // Validate the node type
    const validTypes = ['keyword', 'entity', 'message', 'topic', 'custom'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get RxDB helper instance
    const dbHelper = await getNebulaDBHelper();

    // Create the new node
    const node = await dbHelper.createMemoryNode({
      label,
      type: type as 'keyword' | 'entity' | 'message' | 'topic' | 'custom',
      user_id: userId,
      metadata: metadata ? JSON.stringify(metadata) : ''
    });

    // Store the node in the vector database
    await storeNodeVector(
      node.id,
      node.label,
      node.type,
      userId.toString(),
      node.metadata ? JSON.parse(node.metadata) : {}
    );

    return NextResponse.json({
      success: true,
      node: {
        id: node.id,
        label: node.label,
        type: node.type,
        metadata: node.metadata ? JSON.parse(node.metadata) : {},
        createdAt: node.created_at,
        updatedAt: node.updated_at
      }
    });
  } catch (error) {
    console.error('Error creating memory node:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create memory node' },
      { status: 500 }
    );
  }
}
