// NebulaDB-backed vector index — full replacement for the Pinecone integration.
// Stores embedded persona data per-user per-category and supports cosine-similarity search.

import { getCollections } from '@/db/nebuladb';
import { getEmbedding, getBatchEmbeddings } from './textEmbedder';
import { cosineSimilarity } from './vectorstore';

export type EmbeddingCategory =
  | 'interest'
  | 'goal'
  | 'trait'
  | 'memory_node'
  | 'note'
  | 'setting';

export interface IndexedEntry {
  id: string;
  userId: string;
  category: EmbeddingCategory;
  text: string;
  vector: number[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EmbeddingSearchResult {
  id: string;
  category: EmbeddingCategory;
  text: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

async function col() {
  const cols = await getCollections();
  return (cols as any).embedding_index;
}

/**
 * Embed `text` and upsert it into the index under the given composite key.
 * The `id` should be prefixed with its category (e.g. "interest-abc123") so
 * entries from different sources cannot collide.
 */
export async function indexEntry(
  id: string,
  userId: string,
  category: EmbeddingCategory,
  text: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const c = await col();
  const vector = await getEmbedding(text);
  const now = new Date().toISOString();

  const existing = await c.findOne({ id, userId });
  if (existing) {
    await c.update({ id, userId }, { $set: { vector, text, metadata, updated_at: now } });
  } else {
    await c.insert({ id, userId, category, text, vector, metadata, created_at: now, updated_at: now });
  }
}

/**
 * Remove a single entry from the index.
 */
export async function deleteEntry(id: string, userId: string): Promise<void> {
  const c = await col();
  await c.delete({ id, userId });
}

/**
 * Embed `queryText` and return the top-K most similar entries for this user.
 * Pass `categories` to restrict the search to specific data types.
 */
export async function searchIndex(
  queryText: string,
  userId: string,
  options: {
    categories?: EmbeddingCategory[];
    topK?: number;
    threshold?: number;
  } = {}
): Promise<EmbeddingSearchResult[]> {
  const { categories, topK = 10, threshold = 0.3 } = options;
  const c = await col();

  const allEntries: IndexedEntry[] = await c.find({ userId }).toArray() ?? [];
  const pool = categories
    ? allEntries.filter(e => categories.includes(e.category))
    : allEntries;

  if (pool.length === 0) return [];

  const queryVector = await getEmbedding(queryText);

  return pool
    .map(entry => ({
      id: entry.id,
      category: entry.category,
      text: entry.text,
      similarity: cosineSimilarity(queryVector, entry.vector),
      metadata: entry.metadata,
    }))
    .filter(r => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Search using a pre-computed query vector (avoids a redundant embed call when
 * the caller already has the vector, e.g. during system prompt assembly).
 */
export async function searchIndexByVector(
  queryVector: number[],
  userId: string,
  options: {
    categories?: EmbeddingCategory[];
    topK?: number;
    threshold?: number;
    excludeId?: string;
  } = {}
): Promise<EmbeddingSearchResult[]> {
  const { categories, topK = 10, threshold = 0.3, excludeId } = options;
  const c = await col();

  const allEntries: IndexedEntry[] = await c.find({ userId }).toArray() ?? [];
  const pool = allEntries.filter(e => {
    if (excludeId && e.id === excludeId) return false;
    if (categories && !categories.includes(e.category)) return false;
    return true;
  });

  if (pool.length === 0) return [];

  return pool
    .map(entry => ({
      id: entry.id,
      category: entry.category,
      text: entry.text,
      similarity: cosineSimilarity(queryVector, entry.vector),
      metadata: entry.metadata,
    }))
    .filter(r => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Retrieve the raw stored entry (including its vector) for a given id.
 * Used by findRelatedNodes to look up a node's vector without re-embedding.
 */
export async function getEntry(id: string, userId: string): Promise<IndexedEntry | null> {
  const c = await col();
  return await c.findOne({ id, userId }) ?? null;
}

/**
 * Count how many entries are currently indexed for a user.
 * Returns 0 when the index is empty (cold-start detection).
 */
export async function countEntries(userId: string): Promise<number> {
  const c = await col();
  const entries: IndexedEntry[] = await c.find({ userId }).toArray() ?? [];
  return entries.length;
}

/**
 * Bulk-index all persona data for a user from the source NebulaDB collections.
 * Uses batch embedding for efficiency (up to 128 texts per API call).
 * Safe to call repeatedly — upserts overwrite stale vectors.
 */
export async function reindexUserData(
  userId: string
): Promise<{ indexed: number; errors: number }> {
  const cols = await getCollections();
  let indexed = 0;
  let errors = 0;

  type BatchItem = { id: string; userId: string; category: EmbeddingCategory; text: string; metadata: Record<string, unknown> };
  const items: BatchItem[] = [];

  // interests
  const interests: any[] = await (cols as any).interest_metrics
    .find({ user_id: parseInt(userId) }).toArray() ?? [];
  for (const i of interests) {
    if (i.topic) items.push({ id: `interest-${i.id}`, userId, category: 'interest', text: i.topic, metadata: { weight: i.weight, topic: i.topic } });
  }

  // active goals
  const goals: any[] = await (cols as any).goal_metrics
    .find({ user_id: parseInt(userId), status: 'active' }).toArray() ?? [];
  for (const g of goals) {
    if (g.description) items.push({ id: `goal-${g.id}`, userId, category: 'goal', text: g.description, metadata: { status: g.status, confidence: g.confidence } });
  }

  // personality traits
  const traits: any[] = await (cols as any).personality_traits
    .find({ user_id: parseInt(userId) }).toArray() ?? [];
  for (const t of traits) {
    const label = t.trait || t.trait_label || '';
    if (label) items.push({ id: `trait-${t.id}`, userId, category: 'trait', text: label, metadata: { percentile: t.percentile } });
  }

  // memory nodes (cap at 200 most recent to avoid runaway batch size)
  const nodes: any[] = await (cols as any).memory_nodes
    .find({ user_id: userId }).toArray() ?? [];
  for (const n of nodes.slice(0, 200)) {
    if (n.label) items.push({ id: `node-${n.id}`, userId, category: 'memory_node', text: n.label, metadata: { type: n.type } });
  }

  if (items.length === 0) return { indexed: 0, errors: 0 };

  // Batch embed all texts
  let vectors: number[][] = [];
  try {
    vectors = await getBatchEmbeddings(items.map(it => it.text));
  } catch (err) {
    console.error('reindexUserData: batch embedding failed', err);
    return { indexed: 0, errors: items.length };
  }

  const c = await col();
  const now = new Date().toISOString();

  for (let i = 0; i < items.length; i++) {
    try {
      const { id, category, text, metadata } = items[i];
      const vector = vectors[i];
      const existing = await c.findOne({ id, userId });
      if (existing) {
        await c.update({ id, userId }, { $set: { vector, text, metadata, updated_at: now } });
      } else {
        await c.insert({ id, userId, category, text, vector, metadata, created_at: now, updated_at: now });
      }
      indexed++;
    } catch {
      errors++;
    }
  }

  return { indexed, errors };
}
