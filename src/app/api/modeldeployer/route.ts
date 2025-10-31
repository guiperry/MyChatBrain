import { NextRequest, NextResponse } from 'next/server';
import adelineInference from '@/lib/adeline';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model = 'gemini-pro', options = {} } = body;

    // Check if any provider is configured
    const availableProviders = adelineInference.getAvailableProviders();
    const configuredProviders = availableProviders.filter(provider =>
      adelineInference.isProviderConfigured(provider)
    );

    if (configuredProviders.length === 0) {
      return NextResponse.json({
        response: `
# API Keys Required

To use this chat application, you need to configure at least one AI provider API key.

## Supported Providers:

### Google Gemini
- Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create an API key and add it to your environment variables as \`NEXT_PUBLIC_GOOGLE_API_KEY\`

### OpenAI
- Visit [OpenAI API](https://platform.openai.com/api-keys)
- Create an API key and add it to your environment variables as \`OPENAI_API_KEY\`

### Anthropic Claude
- Visit [Anthropic Console](https://console.anthropic.com/)
- Create an API key and add it to your environment variables as \`ANTHROPIC_API_KEY\`

## How to add your API keys:

1. Create a \`.env.local\` file in your project root
2. Add your API keys in the format shown above
3. Restart your development server

After adding your API keys, you can start using the chat!
        `
      });
    }

    // Validate model is supported
    const availableModels = adelineInference.getAvailableModels();
    if (!availableModels.includes(model)) {
      console.warn(`Model "${model}" not supported, defaulting to gemini-1.5-pro`);
    }

    console.log(`Using model: ${model}`);

    // Run inference with Adeline
    const result = await adelineInference.runInference(prompt, {
      model: model,
      temperature: options.temperature ?? 0.9,
      maxTokens: options.maxTokens ?? 2048,
      enableCache: options.enableCache ?? true
    });

    // Return response in the format expected by the frontend
    return NextResponse.json({
      choices: [{
        message: {
          content: result.response
        }
      }],
      usage: result.usage,
      latency: result.latency,
      provider: result.provider,
      model: result.model
    });

  } catch (error) {
    console.error("Error in Adeline ModelDeployer API route:", error);
    const errorMessage = (error as Error).message;

    // Check for specific error messages and provide helpful responses
    if (errorMessage.includes("API key not configured")) {
      return NextResponse.json({
        response: `
# API Key Configuration Error

${errorMessage}

## Supported Providers and their environment variables:

- **Google Gemini**: \`NEXT_PUBLIC_GOOGLE_API_KEY\`
- **OpenAI**: \`OPENAI_API_KEY\`
- **Anthropic Claude**: \`ANTHROPIC_API_KEY\`

Please check your environment variables and ensure at least one provider is properly configured.
        `
      }, { status: 400 });
    }

    if (errorMessage.includes("Provider") && errorMessage.includes("not configured")) {
      return NextResponse.json({
        response: `
# Provider Configuration Error

${errorMessage}

Make sure you have set up the API key for the provider you're trying to use.
        `
      }, { status: 400 });
    }

    if (errorMessage.includes("Model") && errorMessage.includes("not found")) {
      return NextResponse.json({
        response: `
# Model Not Found

${errorMessage}

## Available models:
${adelineInference.getAvailableModels().join(', ')}

Please use one of the supported models listed above.
        `
      }, { status: 400 });
    }

    // For other errors, return a generic message
    return NextResponse.json({
      response: `
# Something went wrong

There was an error processing your request: ${errorMessage}

## Troubleshooting steps:

1. Check that your API keys are properly configured in environment variables
2. Verify the model name is supported (see available models above)
3. Ensure your API keys have sufficient credits/quota
4. Try switching to a different provider if one is failing

If the problem persists, check the server logs for more detailed error information.
      `
    }, { status: 400 });
  }
}
