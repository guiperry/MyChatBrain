declare module '@pinecone-database/pinecone' {
  export type RecordValues = number[];
  
  export interface PineconeRecord {
    id: string;
    values: RecordValues;
    metadata?: Record<string, any>;
  }
  
  export class Pinecone {
    constructor(options: { apiKey: string });
    index(name: string): PineconeIndex;
  }
  
  export interface PineconeIndex {
    upsert(records: PineconeRecord[]): Promise<any>;
    query(options: {
      vector: RecordValues;
      topK: number;
      includeMetadata?: boolean;
      filter?: Record<string, any>;
    }): Promise<any>;
    fetch(ids: string[]): Promise<{
      records: Record<string, {
        id: string;
        values: RecordValues;
        metadata?: Record<string, any>;
      }>;
    }>;
    delete(ids: string[]): Promise<void>;
  }
}