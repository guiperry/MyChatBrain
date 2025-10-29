// Type definitions for database functions

/**
 * Type-safe wrapper for db.get function
 * @param sql SQL query string
 * @param params Query parameters
 * @returns The first row that matches the query, or undefined if no rows match
 */
export function typedGet<T>(
  db: any,
  sql: string,
  params: any[] = []
): T | undefined {
  return db.get(sql, params) as T | undefined;
}

/**
 * Type-safe wrapper for db.all function
 * @param sql SQL query string
 * @param params Query parameters
 * @returns Array of rows that match the query
 */
export function typedAll<T>(
  db: any,
  sql: string,
  params: any[] = []
): T[] {
  return db.all(sql, params) as T[];
}

/**
 * Type-safe wrapper for db.run function
 * @param sql SQL query string
 * @param params Query parameters
 * @returns Result of the query
 */
export function typedRun(
  db: any,
  sql: string,
  params: any[] = []
): any {
  return db.run(sql, params);
}// src/db/types.ts
export interface User {
    id: number;
    username: string;
    email: string;
    password: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface Setting {
    id: number;
    user_id: number;
    key: string;
    value: string | null;
    created_at: string;
    updated_at: string;
  }
  
  export interface ChatSession {
    id: number;
    user_id: number | null;
    title: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface ChatMessage {
    id: number;
    session_id: number;
    content: string;
    role: 'user' | 'bot';
    timestamp: string;
  }

  export interface Prompt {
    id: number;
    user_id: number | null;
    content: string;
    title: string | null;
    created_at: string;
    updated_at: string;
  }
  