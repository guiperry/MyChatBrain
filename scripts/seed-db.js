#!/usr/bin/env node

// Add crypto polyfill for Node.js environment
const { webcrypto } = require('crypto');
global.crypto = webcrypto;

// Seed the database with initial data
const { getNebulaDBHelper } = require('../src/db/nebuladb-helper');
const { collections } = require('../src/db/nebuladb');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  console.log('Seeding NebulaDB database...');

  try {
    // Get NebulaDB helper instance
    const dbHelper = await getNebulaDBHelper();

    // Check if admin user already exists
    const existingAdmin = await dbHelper.getUserByUsername('admin');

    if (!existingAdmin) {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      // Create admin user with ID 1
      const adminUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Insert directly
      await collections.users.insert(adminUser);

      console.log('Admin user created successfully');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists');
    }

    // Seed some default prompts
    const defaultPrompts = [
      {
        content: "You are a helpful AI assistant. Provide clear, accurate, and concise responses to user queries.",
        title: "General Assistant"
      },
      {
        content: "You are an expert software developer. Provide detailed code examples and explanations when helping with programming tasks.",
        title: "Code Expert"
      },
      {
        content: "You are a creative writing assistant. Help users with storytelling, character development, and narrative structure.",
        title: "Writing Assistant"
      }
    ];

    for (const prompt of defaultPrompts) {
      // Check if prompt already exists (look for prompts with null user_id)
      const existingPrompts = await dbHelper.getPrompts(null);
      const existing = existingPrompts.find(p => p.title === prompt.title);

      if (!existing) {
        await dbHelper.createPrompt({
          content: prompt.content,
          title: prompt.title,
          user_id: null
        });
        console.log(`Seeded prompt: ${prompt.title}`);
      } else {
        console.log(`Prompt already exists: ${prompt.title}`);
      }
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
