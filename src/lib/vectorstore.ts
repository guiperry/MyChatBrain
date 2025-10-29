// src/lib/vectorstore.ts



interface VectorItem {
    vector: number[];
    text: string;
    metadata: any;
}

interface SearchResult {
    score: number;
    metadata: any;
    text: string;
}
class LocalVectorStore {
    vector: { vector: number[], text: string, metadata: any }[];
    constructor() {
        this.vector = [];
    }
    async add(vector: number[], text: string, metadata: any): Promise<void> {
        this.vector.push({ vector: vector, text: text, metadata: metadata });
    }
    
    async search(query: number[], k: number = 5): Promise<SearchResult[]> {
        if (this.vector.length === 0) {
            return [];
        }
        const scores: SearchResult[] = this.vector.map((item: VectorItem) => {
            return { score: cosineSimilarity(query, item.vector), metadata: item.metadata, text: item.text };
        });
        scores.sort((a, b) => b.score - a.score);
        return scores.slice(0, k);
    }
    async clear() {
        this.vector = [];
    }
}

function normalize(vector: number[]): number[] {
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
        norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);
    for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
    }
    return vector;
}

class RecursiveCharacterTextSplitter {
    chunkSize: number;
    chunkOverlap: number;

    constructor({ chunkSize, chunkOverlap }: { chunkSize: number, chunkOverlap: number }) {
        this.chunkSize = chunkSize;
        this.chunkOverlap = chunkOverlap;
    }

    async splitText(text: string): Promise<string[]> {
        const chunks = [];
        for (let i = 0; i < text.length; i += this.chunkSize - this.chunkOverlap) {
            chunks.push(text.substring(i, i + this.chunkSize));
        }
        return chunks;
    }
}



interface Vector {
    [index: number]: number;
    length: number;
}

function cosineSimilarity(vecA: Vector, vecB: Vector): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
const vectorStore = new LocalVectorStore();
export default vectorStore;
export { RecursiveCharacterTextSplitter, cosineSimilarity, LocalVectorStore, normalize };
export type { SearchResult, VectorItem };

export class VectorStore {
    private client: any;
    private className: string;
    constructor(client: any, className: string) {
      this.client = client;
      this.className = className;
    }


    async getRelevantDocuments(prompt: string): Promise<{ pageContent: string }[]> {

      // Implement the logic to get relevant documents

      return []; // Placeholder return

    }
    // Add other methods here

  }

/**
 * Generate an embedding for a text string
 * This is a placeholder implementation that creates random embeddings
 * In a production environment, you would use a real embedding model like OpenAI's text-embedding-ada-002
 * @param text The text to generate an embedding for
 * @returns An array of numbers representing the embedding
 */
export async function getEmbedding(text: string): Promise<number[]> {
  // For demonstration purposes, we'll create a simple random embedding
  // In a real implementation, you would call an embedding API

  // Create a deterministic "embedding" based on the text
  // This is NOT a real embedding, just a placeholder for demonstration
  const embedding = new Array(1536).fill(0);

  // Use the text to seed the embedding values
  // This creates a deterministic but not semantically meaningful vector
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  // Use the hash to seed a simple random number generator
  const seededRandom = (seed: number) => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // Fill the embedding with seeded random values
  for (let i = 0; i < embedding.length; i++) {
    embedding[i] = seededRandom(hash + i) * 2 - 1; // Values between -1 and 1
  }

  // Normalize the embedding
  return normalize(embedding);
}
