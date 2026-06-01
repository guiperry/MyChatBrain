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

// Real semantic embeddings via the landmark-lattice-v1 embedder service.
export { getEmbedding } from './textEmbedder';
