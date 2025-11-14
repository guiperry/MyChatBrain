// Re-export the NebulaDB helper as the main database interface
export { getNebulaDBHelper as db } from './nebuladb-helper';

// Also export schema for compatibility
export * as schema from './schema';
