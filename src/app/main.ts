/**
 * Main Application Entry Point
 * This file serves as the primary application startup point for database seeding
 */

import { initializeDatabase } from '@/database/nebuladb';

// Main application startup function
export async function main() {
  console.log('🚀 Starting main application...');
  
  try {
    // Initialize database with seeding
    await initializeDatabase();
    
    console.log('✅ Main application startup completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Main application startup failed:', error);
    throw error;
  }
}

// Auto-start in development mode
if (process.env.NODE_ENV === 'development') {
  main().catch(console.error);
}

export default main;