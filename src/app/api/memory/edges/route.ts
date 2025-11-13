import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getCurrentUser } from '@/lib/auth';

// POST /api/memory/edges - Create a new edge in the memory graph
export async function POST(req: NextRequest) {
  try {
    // Get the current user
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await req.json();
    const { sourceId, targetId, relation, weight, metadata } = body;

    // Validate the request
    if (!sourceId || !targetId || !relation) {
      return NextResponse.json(
        { success: false, error: 'Source ID, target ID, and relation are required' },
        { status: 400 }
      );
    }

    // Validate the relation type
    const validRelations = ['related_to', 'mentioned_in', 'part_of', 'temporal', 'custom'];
    if (!validRelations.includes(relation)) {
      return NextResponse.json(
        { success: false, error: `Relation must be one of: ${validRelations.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate the weight
    const edgeWeight = weight || 5; // Default to 5 if not provided
    if (edgeWeight < 1 || edgeWeight > 10) {
      return NextResponse.json(
        { success: false, error: 'Weight must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Get RxDB helper instance
    const NebulaDBHelper = await db();

    // Verify that both nodes exist and belong to the user
    const sourceNode = await NebulaDBHelper.getMemoryNode(parseInt(sourceId));
    const targetNode = await NebulaDBHelper.getMemoryNode(parseInt(targetId));

    if (!sourceNode) {
      return NextResponse.json(
        { success: false, error: 'Source node not found or does not belong to the user' },
        { status: 404 }
      );
    }

    if (!targetNode) {
      return NextResponse.json(
        { success: false, error: 'Target node not found or does not belong to the user' },
        { status: 404 }
      );
    }

    // Check if the edge already exists
    const existingEdges = await NebulaDBHelper.findMemoryEdge(
      parseInt(sourceId),
      parseInt(targetId),
      relation
    );

    let edge;
    if (existingEdges.length > 0) {
      // Update the existing edge
      const existingEdge = existingEdges[0];
      edge = await existingEdge.patch({
        weight: edgeWeight,
        metadata: metadata || '',
        updated_at: new Date().toISOString()
      });
    } else {
      // Create the new edge
      edge = await NebulaDBHelper.createMemoryEdge({
        source_id: parseInt(sourceId),
        target_id: parseInt(targetId),
        relation: relation,
        weight: edgeWeight,
        metadata: metadata || ''
      });
    }

    return NextResponse.json({
      success: true,
      edge: edge ? {
        id: edge.id,
        source: edge.source_id.toString(),
        target: edge.target_id.toString(),
        relation: edge.relation,
        weight: edge.weight,
        metadata: edge.metadata ? JSON.parse(edge.metadata) : {},
        createdAt: edge.created_at,
        updatedAt: edge.updated_at
      } : null
    });
  } catch (error) {
    console.error('Error creating/updating memory edge:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create/update memory edge' },
      { status: 500 }
    );
  }
}

// DELETE /api/memory/edges - Delete an edge from the memory graph
export async function DELETE(req: NextRequest) {
  try {
    // Get the current user
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get the edge ID from the query parameters
    const url = new URL(req.url);
    const edgeId = url.searchParams.get('id');
    if (!edgeId) {
      return NextResponse.json(
        { success: false, error: 'Edge ID is required' },
        { status: 400 }
      );
    }

    // Get RxDB helper instance
    const NebulaDBHelper = await db();

    // Verify that the edge exists and belongs to the user
    const edge = await NebulaDBHelper.getMemoryNode(parseInt(edgeId));
    
    if (!edge) {
      return NextResponse.json(
        { success: false, error: 'Edge not found or does not belong to the user' },
        { status: 404 }
      );
    }

    // Delete the edge
    await NebulaDBHelper.deleteMemoryNode(parseInt(edgeId));

    return NextResponse.json({
      success: true,
      message: 'Edge deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting memory edge:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete memory edge' },
      { status: 500 }
    );
  }
}