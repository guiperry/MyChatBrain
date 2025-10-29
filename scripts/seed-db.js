#!/usr/bin/env node

// Seed the database with initial data
import { db } from '../src/db/index.tsx';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  console.log('Seeding database...');

  try {
    // Check if admin user already exists
    const existingAdmin = db.get('SELECT * FROM users WHERE username = ?', ['admin']);

    if (!existingAdmin) {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      // Create admin user
      const timestamp = new Date().toISOString();
      db.run(
        'INSERT INTO users (username, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@example.com', hashedPassword, timestamp, timestamp]
      );
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
      // Check if prompt already exists
      const existing = db.get(
        'SELECT id FROM prompts WHERE content = ? AND user_id IS NULL',
        [prompt.content]
      );

    if (!existing) {
      const timestamp = new Date().toISOString();
      db.run(
        'INSERT INTO prompts (content, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [prompt.content, prompt.title, timestamp, timestamp]
      );
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
