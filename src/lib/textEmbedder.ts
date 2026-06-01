// HTTP client for the landmark-lattice-v1 text embedder.
// All embedding generation in MyChatBrain should go through this module.

const BASE_URL = (
  process.env.NEXT_PUBLIC_EMBEDDER_URL || 'https://text-embedder-nine.vercel.app'
).replace(/\/$/, '');

export interface EmbedResponse {
  embedding: number[];
  dimensions: number;
  model: string;
  token_count: number;
}

export interface BatchEmbedResult {
  index: number;
  embedding: number[];
  dimensions: number;
  token_count: number;
}

export interface BatchEmbedResponse {
  results: BatchEmbedResult[];
  model: string;
  count: number;
}

// In-process request-scoped cache: same text in the same request lifecycle
// won't be re-embedded. Keyed by text, values evicted after 60 s.
const _cache = new Map<string, { vector: number[]; ts: number }>();
const CACHE_TTL = 60_000;

function fromCache(text: string): number[] | null {
  const entry = _cache.get(text);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(text); return null; }
  return entry.vector;
}

function toCache(text: string, vector: number[]): void {
  if (_cache.size > 512) {
    // evict oldest quarter
    const keys = [..._cache.keys()].slice(0, 128);
    keys.forEach(k => _cache.delete(k));
  }
  _cache.set(text, { vector, ts: Date.now() });
}

/**
 * Embed a single text string.
 * Returns a 768-element int32 array where each element is in [0, 10000].
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const cached = fromCache(text);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error(`textEmbedder /embed failed: ${res.status} ${res.statusText}`);
  }
  const data: EmbedResponse = await res.json();
  toCache(text, data.embedding);
  return data.embedding;
}

/**
 * Batch-embed up to N texts. Automatically chunks at 128 (API limit).
 * Returns embeddings in the same order as the input array.
 */
export async function getBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const results: number[][] = new Array(texts.length);
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const cached = fromCache(texts[i]);
    if (cached) {
      results[i] = cached;
    } else {
      uncachedIndices.push(i);
      uncachedTexts.push(texts[i]);
    }
  }

  for (let start = 0; start < uncachedTexts.length; start += 128) {
    const chunk = uncachedTexts.slice(start, start + 128);
    const res = await fetch(`${BASE_URL}/embed/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: chunk }),
    });
    if (!res.ok) {
      throw new Error(`textEmbedder /embed/batch failed: ${res.status} ${res.statusText}`);
    }
    const data: BatchEmbedResponse = await res.json();
    const sorted = data.results.sort((a, b) => a.index - b.index);
    sorted.forEach((r, chunkOffset) => {
      const originalIndex = uncachedIndices[start + chunkOffset];
      results[originalIndex] = r.embedding;
      toCache(texts[originalIndex], r.embedding);
    });
  }

  return results;
}

/**
 * Ask the embedder service to compute similarity directly between two texts.
 * Returns a float in [0, 1]. Prefer this over local cosine similarity when
 * you only need pairwise comparison and don't need the raw vectors.
 */
export async function getTextSimilarity(textA: string, textB: string): Promise<number> {
  const res = await fetch(`${BASE_URL}/similarity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text_a: textA, text_b: textB }),
  });
  if (!res.ok) {
    throw new Error(`textEmbedder /similarity failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.similarity as number;
}

/**
 * Health-check the embedder service.
 */
export async function checkEmbedderHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
