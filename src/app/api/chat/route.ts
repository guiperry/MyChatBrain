import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, prompt } = body;

    // Use 'message' if provided, otherwise fall back to 'prompt' for compatibility
    const chatMessage = message || prompt;

    if (!chatMessage) {
      return NextResponse.json({
        response: 'Error: No message provided'
      }, { status: 400 });
    }

    // Get Cloudflare credentials from environment
    const apiKey = process.env.CLOUDFLARE_API_KEY;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const model = process.env.CLOUDFLARE_MODEL || '@cf/meta/llama-3.1-8b-instruct';

    if (!apiKey) {
      return NextResponse.json({
        response: `
# Cloudflare API Configuration Required

To use the Cloudflare Workers AI chat service, you need to configure your API credentials:

## Required Environment Variables:

- **CLOUDFLARE_API_KEY**: Your Cloudflare API token
- **CLOUDFLARE_ACCOUNT_ID**: Your Cloudflare account ID
- **CLOUDFLARE_MODEL** (optional): The AI model to use (defaults to @cf/meta/llama-3.1-8b-instruct)

## How to get your credentials:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to AI > Workers AI
3. Create an API token if you don't have one
4. Copy your Account ID from the dashboard URL or account settings

Add these to your \`.env.local\` file and restart the server.
        `
      });
    }

    // Initialize OpenAI client with Cloudflare Workers AI endpoint
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`,
    });

    // Make chat completion request
    const chatCompletion = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'user',
          content: chatMessage
        }
      ],
    });

    const response = chatCompletion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response received from Cloudflare Workers AI');
    }

    return NextResponse.json({
      response: response
    });

  } catch (error) {
    console.error("Error in Cloudflare Workers AI chat API route:", error);
    const errorMessage = (error as Error).message;

    return NextResponse.json({
      response: `
# Cloudflare Workers AI Connection Error

There was a problem connecting to the Cloudflare Workers AI service at chat.knirv.com:

${errorMessage}

## Troubleshooting:

1. Verify your CLOUDFLARE_API_KEY is correct
2. Ensure your API token has the necessary permissions for Workers AI
3. Check that your Cloudflare account has Workers AI enabled
4. Confirm that chat.knirv.com is properly configured as your Workers AI endpoint
5. Try a different model if the current one is unavailable

Please check your environment variables and try again.
      `
    });
  }
}
