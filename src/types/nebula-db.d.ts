declare module '@nebula-db/nebula-db' {
  interface DatabaseConfig {
    storage: string;
    path: string;
    validation: boolean;
    performance?: {
      queryCache?: {
        enabled: boolean;
        maxSize: number;
        ttl: number;
      };
      concurrency?: {
        maxConnections: number;
        poolSize: number;
      };
      compression?: {
        enabled: boolean;
        algorithm: string;
        threshold: number;
      };
      batchOperations?: {
        enabled: boolean;
        maxBatchSize: number;
        flushInterval: number;
      };
    };
  }

  interface CollectionConfig {
    indexes: Array<{
      name: string;
      fields: string[];
      type: 'unique' | 'single';
    }>;
  }

  interface Collection<T> {
    insert(doc: T): Promise<T>;
    findOne(query: any): Promise<T | null>;
    update(query: any, update: any): Promise<any>;
    delete(query: any): Promise<any>;
    subscribe(query: any, callback: (data: any) => void): { unsubscribe(): void };
    subscribeToChanges(callback: (change: any) => void): { unsubscribe(): void };
  }

  interface Database {
    collection<T>(name: string, config: CollectionConfig): Collection<T>;
    get(query: string, params?: any[]): any;
    all(query: string, params?: any[]): any[];
  }

  export function createDatabase(config: DatabaseConfig): Database;
  export type { Database, Collection };
}