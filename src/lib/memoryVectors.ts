// Vector storage and retrieval for memory nodes — backed by the local embedding
// index (NebulaDB + landmark-lattice-v1 embedder). All Pinecone references removed.

import {
  indexEntry,
  deleteEntry,
  searchIndex,
  searchIndexByVector,
  getEntry,
} from './embeddingIndex';

/**
 * Embed and store a memory node in the vector index.
 * Identical signature to the previous Pinecone-backed version.
 */
export async function storeNodeVector(
  nodeId: string,
  label: string,
  type: string,
  userId: string,
  metadata: Record<string, unknown> = {}
): Promise<{ success: boolean; error?: unknown }> {
  try {
    await indexEntry(`node-${nodeId}`, userId, 'memory_node', label, { type, ...metadata });
    return { success: true };
  } catch (error) {
    console.error('Error storing node vector:', error);
    return { success: false, error };
  }
}

/**
 * Remove a memory node from the vector index.
 */
export async function deleteNodeVector(
  nodeId: string,
  userId: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    await deleteEntry(`node-${nodeId}`, userId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting node vector:', error);
    return { success: false, error };
  }
}

/**
 * Find memory nodes semantically similar to a text query.
 */
export async function findSimilarNodes(
  query: string,
  userId: string,
  limit: number = 10,
  threshold: number = 0.3
): Promise<{
  success: boolean;
  results?: { nodeId: string; label: string; type: string; similarity: number }[];
  error?: unknown;
}> {
  try {
    const hits = await searchIndex(query, userId, {
      categories: ['memory_node'],
      topK: limit,
      threshold,
    });
    return {
      success: true,
      results: hits.map(h => ({
        nodeId: h.id.replace(/^node-/, ''),
        label: h.text,
        type: String(h.metadata.type ?? ''),
        similarity: h.similarity,
      })),
    };
  } catch (error) {
    console.error('Error finding similar nodes:', error);
    return { success: false, error };
  }
}

/**
 * Find memory nodes semantically related to a given node, using that node's
 * stored vector rather than re-embedding (no extra API call needed).
 */
export async function findRelatedNodes(
  nodeId: string,
  userId: string,
  limit: number = 5,
  threshold: number = 0.4
): Promise<{
  success: boolean;
  results?: { nodeId: string; label: string; type: string; similarity: number }[];
  error?: unknown;
}> {
  try {
    const entryId = `node-${nodeId}`;
    const entry = await getEntry(entryId, userId);
    if (!entry) {
      return { success: false, error: 'Node vector not found in index' };
    }

    const hits = await searchIndexByVector(entry.vector, userId, {
      categories: ['memory_node'],
      topK: limit,
      threshold,
      excludeId: entryId,
    });

    return {
      success: true,
      results: hits.map(h => ({
        nodeId: h.id.replace(/^node-/, ''),
        label: h.text,
        type: String(h.metadata.type ?? ''),
        similarity: h.similarity,
      })),
    };
  } catch (error) {
    console.error('Error finding related nodes:', error);
    return { success: false, error };
  }
}
