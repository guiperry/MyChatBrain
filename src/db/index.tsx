// Re-export the RxDB helper as the main database interface
export { getRxDBHelper as db } from './rxdb';

// Also export schema for compatibility
export * as schema from './schema';
