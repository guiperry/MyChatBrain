#!/usr/bin/env node

// Seed the database with initial data
import { getRxDBHelper } from '../src/db/rxdb.js';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  console.log('Seeding RxDB database...');

  try {
    // Get RxDB helper instance
    const rxdbHelper = await getRxDBHelper();

    // Check if admin user already exists
    const existingAdmin = await rxdbHelper.getUserByUsername('admin');

    if (!existingAdmin.length === 0) {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      // Create admin user
      await rxdbHelper.createUser({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword
      });

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
      const existingPrompts = await rxdbHelper.getPrompts(null);
      const existing = existingPrompts.find(p => p.content === prompt.content);

      if (!existing) {
        await rxdbHelper.createPrompt({
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
