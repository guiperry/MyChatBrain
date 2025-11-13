#!/usr/bin/env node

// Add crypto polyfill for Node.js environment
const { webcrypto } = require('crypto');
global.crypto = webcrypto;

// Check database contents
const { getNebulaDBHelper } = require('../database/nebuladb-helper');

async function checkDatabase() {
  console.log('Checking NebulaDB database...');

  try {
    // Get NebulaDB helper instance
    const dbHelper = await getNebulaDBHelper();

    // Check admin user
    const adminUser = await dbHelper.getUserByUsername('admin');
    console.log('Admin user found:', !!adminUser);
    if (adminUser) {
      console.log('Admin user ID:', adminUser._id);
      console.log('Admin username:', adminUser.username);
      console.log('Admin email:', adminUser.email);
    }

    // Check all users
    const allUsers = await dbHelper.getChatSessions();
    console.log('Total chat sessions in database:', allUsers.length);

    // Check prompts
    const prompts = await dbHelper.getPrompts(null);
    console.log('Total prompts:', prompts.length);

    console.log('Database check completed successfully');
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
}

checkDatabase();