import { db, collections } from '@/database/nebuladb';

import { Pinecone } from '@pinecone-database/pinecone';
import { getEmbedding } from './vectorstore';

// Initialize Pinecone client
let pinecone: Pinecone | null = null;

const initPinecone = async () => {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
    });
  }
  return pinecone;
};

// Index name for memory nodes
const MEMORY_INDEX = 'memory-nodes';

/**
 * Store a memory node in the vector database
 * @param nodeId The ID of the node in SQLite
 * @param label The label/text of the node
 * @param type The type of the node
 * @param userId The user ID
 * @param metadata Additional metadata
 */
export async function storeNodeVector(
  nodeId: string,
  label: string,
  type: string,
  userId: string,
  metadata: Record<string, any> = {}
) {
  try {
    // Initialize Pinecone
    const pinecone = await initPinecone();
    const index = pinecone.index(MEMORY_INDEX);

    // Generate embedding for the node text
    const embedding = await getEmbedding(label);

    // Store the vector in Pinecone
    await index.upsert([
      {
        id: `node-${nodeId}`,
        values: embedding,
        metadata: {
          nodeId,
          label,
          type,
          userId,
          ...metadata,
        },
      },
    ]);

    return { success: true };
  } catch (error) {
    console.error('Error storing node vector:', error);
    return { success: false, error };
  }
}

/**
 * Delete a node vector from the vector database
 * @param nodeId The ID of the node
 */
export async function deleteNodeVector(nodeId: string) {
  try {
    // Initialize Pinecone
    const pinecone = await initPinecone();
    const index = pinecone.index(MEMORY_INDEX);

    // Delete the vector from Pinecone
    await index.delete([`node-${nodeId}`]);

    return { success: true };
  } catch (error) {
    console.error('Error deleting node vector:', error);
    return { success: false, error };
  }
}

/**
 * Find similar nodes based on text query
 * @param query The text query
 * @param userId The user ID
 * @param limit The maximum number of results to return
 * @param threshold The similarity threshold (0-1)
 */
export async function findSimilarNodes(
  query: string,
  userId: string,
  limit: number = 10,
  threshold: number = 0.7
) {
  try {
    // Initialize Pinecone
    const pinecone = await initPinecone();
    const index = pinecone.index(MEMORY_INDEX);

    // Generate embedding for the query
    const embedding = await getEmbedding(query);

    // Query Pinecone for similar vectors
    const queryResponse = await index.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true,
      filter: {
        userId: { $eq: userId },
      },
    });

    // Filter results by similarity threshold and format the response
    const results = queryResponse.matches
      .filter((match: any) => match.score && match.score >= threshold)
      .map((match: any) => ({
        nodeId: match.metadata?.nodeId,
        label: match.metadata?.label,
        type: match.metadata?.type,
        similarity: match.score,
      }));

    return { success: true, results };
  } catch (error) {
    console.error('Error finding similar nodes:', error);
    return { success: false, error };
  }
}

/**
 * Find semantically related nodes for a given node
 * @param nodeId The ID of the node
 * @param userId The user ID
 * @param limit The maximum number of results to return
 * @param threshold The similarity threshold (0-1)
 */
export async function findRelatedNodes(
  nodeId: string,
  userId: string,
  limit: number = 5,
  threshold: number = 0.75
) {
  try {
    // Initialize Pinecone
    const pinecone = await initPinecone();
    const index = pinecone.index(MEMORY_INDEX);

    // First get the vector for the node
    const nodeVector = await index.fetch([`node-${nodeId}`]);
    const nodeId_key = `node-${nodeId}`;

    if (!nodeVector.records || !nodeVector.records[nodeId_key]) {
      return { success: false, error: 'Node vector not found' };
    }

    const vector = nodeVector.records[nodeId_key].values;

    // Query Pinecone for similar vectors
    const queryResponse = await index.query({
      vector: vector,
      topK: limit + 1, // Add 1 to account for the node itself
      includeMetadata: true,
      filter: {
        userId: { $eq: userId },
      },
    });

    // Filter out the node itself and apply threshold
    const results = queryResponse.matches
      .filter(
        (match: any) =>
          match.metadata?.nodeId !== nodeId &&
          match.score &&
          match.score >= threshold
      )
      .map((match: any) => ({
        nodeId: match.metadata?.nodeId,
        label: match.metadata?.label,
        type: match.metadata?.type,
        similarity: match.score,
      }));

    return { success: true, results };
  } catch (error) {
    console.error('Error finding related nodes:', error);
    return { success: false, error };
  }
}