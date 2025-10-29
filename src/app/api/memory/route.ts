import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { storeNodeVector } from '@/lib/memoryVectors';
import { MemoryNodes, MemoryEdges } from '@/db/schema';

// Helper function for type-safe database queries
function typedAll<T>(db: any, query: string, params: any[] = []): T[] {
  return db.all(query, params) as T[];
}

// Helper function for type-safe database get
function typedGet<T>(db: any, query: string, params: any[] = []): T {
  return db.get(query, params) as T;
}

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

    // Get all nodes for the user with type safety
    const nodes = typedAll<MemoryNodes>(
      db,
      'SELECT id, label, type, metadata, created_at, updated_at FROM memory_nodes WHERE user_id = ?',
      [userId]
    );

    // Get all edges for the user's nodes with type safety
    const edges = typedAll<MemoryEdges>(
      db,
      `
      SELECT e.id, e.source_id, e.target_id, e.relation, e.weight, e.metadata, e.created_at, e.updated_at
      FROM memory_edges e
      JOIN memory_nodes n1 ON e.source_id = n1.id
      JOIN memory_nodes n2 ON e.target_id = n2.id
      WHERE n1.user_id = ? AND n2.user_id = ?
    `, [userId, userId]
    );

    // Format the response with proper typing
    const formattedNodes = nodes.map((node: MemoryNodes) => ({
      id: node.id!.toString(),
      label: node.label,
      type: node.type,
      metadata: node.metadata ? JSON.parse(node.metadata) : {},
      createdAt: node.created_at,
      updatedAt: node.updated_at
    }));

    const formattedEdges = edges.map((edge: MemoryEdges) => ({
      id: edge.id!.toString(),
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

    // Insert the new node
    const result = db.run(
      `INSERT INTO memory_nodes (user_id, label, type, metadata) VALUES (?, ?, ?, ?)`,
      [userId, label, type, metadata ? JSON.stringify(metadata) : null]
    );

    // Get the inserted node
    const node = typedGet<MemoryNodes>(db, 'SELECT * FROM memory_nodes WHERE id = ?', [result.lastInsertRowid]);

    // Store the node in the vector database
    await storeNodeVector(
      node.id!.toString(),
      node.label,
      node.type,
      userId.toString(),
      node.metadata ? JSON.parse(node.metadata) : {}
    );

    return NextResponse.json({
      success: true,
      node: {
        id: node.id!.toString(),
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
