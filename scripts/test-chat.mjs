#!/usr/bin/env node

/**
 * Test script for the Cloudflare Workers AI chat integration
 * Usage: node scripts/test-chat.mjs "Your test message here"
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const message = process.argv[2] || 'Hello, can you tell me a joke?';

console.log('🧪 Testing Cloudflare Workers AI Chat Integration');
console.log('================================================\n');

console.log('Test message:', message);
console.log('CLOUDFLARE_API_KEY:', process.env.CLOUDFLARE_API_KEY ? '✅ Set' : '❌ Not set');
console.log('CLOUDFLARE_ACCOUNT_ID:', process.env.CLOUDFLARE_ACCOUNT_ID ? '✅ Set' : '❌ Not set');
console.log('CLOUDFLARE_MODEL:', process.env.CLOUDFLARE_MODEL || 'Not set (will use default)');
console.log('');

async function testChatAPI() {
  try {
    console.log('📡 Testing direct API call to /api/chat...');

    const response = await fetch('http://localhost:3002/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    console.log('');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

async function testDirectOpenAI() {
  try {
    console.log('🔧 Testing direct OpenAI SDK call...');

    const apiKey = process.env.CLOUDFLARE_API_KEY;
    const model = process.env.CLOUDFLARE_MODEL || '@cf/meta/llama-3.1-8b-instruct';

    if (!apiKey) {
      console.error('❌ CLOUDFLARE_API_KEY not set');
      return;
    }

    // Try with chat.knirv.com base URL
    console.log('Trying baseURL: https://chat.knirv.com/v1');
    const client1 = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://chat.knirv.com/v1',
    });

    try {
      const chatCompletion1 = await client1.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: message }],
      });
      console.log('✅ Success with chat.knirv.com!');
      console.log('Response:', chatCompletion1.choices[0]?.message?.content);
      return;
    } catch (error) {
      console.log('❌ Failed with chat.knirv.com:', error.message);
    }

    // Try with standard Cloudflare API (needs account ID)
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    if (accountId) {
      console.log('Trying standard Cloudflare API with account ID...');
      const client2 = new OpenAI({
        apiKey: apiKey,
        baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`,
      });

      try {
        const chatCompletion2 = await client2.chat.completions.create({
          model: model,
          messages: [{ role: 'user', content: message }],
        });
        console.log('✅ Success with standard Cloudflare API!');
        console.log('Response:', chatCompletion2.choices[0]?.message?.content);
        return;
      } catch (error) {
        console.log('❌ Failed with standard Cloudflare API:', error.message);
      }
    } else {
      console.log('⚠️  CLOUDFLARE_ACCOUNT_ID not set, skipping standard API test');
    }

  } catch (error) {
    console.error('❌ Direct OpenAI test failed:', error.message);
  }
}

async function main() {
  await testChatAPI();
  console.log('');
  await testDirectOpenAI();

  console.log('\n📋 Troubleshooting tips:');
  console.log('1. Verify CLOUDFLARE_API_KEY is a valid Cloudflare API token');
  console.log('2. Check if chat.knirv.com is your custom Workers AI domain');
  console.log('3. If using standard Cloudflare API, ensure CLOUDFLARE_ACCOUNT_ID is set');
  console.log('4. Try different models: @cf/meta/llama-3.1-8b-instruct, @cf/openai/gpt-oss-120b');
  console.log('5. Check Cloudflare dashboard for API token permissions');
}

main().catch(console.error);
