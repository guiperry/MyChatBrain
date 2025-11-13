import { getNebulaDBHelper } from '@/database/nebuladb-helper';
import bcrypt from 'bcryptjs';

let isSeeded = false;

export async function initializeDatabase() {
  if (isSeeded) return;

  try {
    console.log('Initializing database...');
    const dbHelper = await getNebulaDBHelper();

    // Check if admin user already exists
    const existingAdmin = await dbHelper.getUserByUsername('admin');

    if (!existingAdmin) {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      // Create admin user
      await dbHelper.createUser({
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
      const existingPrompts = await dbHelper.getPrompts(null);
      const existing = existingPrompts.find((p: any) => p.content === prompt.content);

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

    console.log('Database initialization completed successfully');
    isSeeded = true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}