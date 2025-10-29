import {
  GoogleGenerativeAI as GoogleGenerativeAIType,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';

interface GenerationConfig {
  temperature: number;
  topK: number;
  topP: number;
  maxOutputTokens: number;
}

interface SafetySetting {
  category: HarmCategory;
  threshold: HarmBlockThreshold;
}

interface Chat {
  sendMessage(prompt: string): Promise<{ response: { text(): string } }>;
}

interface Model {
  startChat(config: {
    generationConfig: GenerationConfig;
    safetySettings: SafetySetting[];
    history: any[];
  }): Chat;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    let modelName = process.env.NEXT_PUBLIC_MODEL_NAME;
    const body = await request.json();
    const { prompt } = body;

    // Check if API key and model name are available
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({
        response: `
# Gemini API Key Required

To use this chat application, you need to provide a Gemini API key.

## How to get a Gemini API key:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

## How to add your API key:

1. Click on the settings icon in the sidebar
2. Paste your API key in the "Gemini API Key" field
3. Click "Save"

After adding your API key, you can start using the chat!
        `
      });
    }

    if (!modelName || modelName.trim() === '') {
      return NextResponse.json({
        response: `
# Gemini Model Name Required

You need to specify which Gemini model to use.

## Recommended models:

- gemini-1.5-pro (most capable)
- gemini-1.5-flash (fastest)
- gemini-pro (legacy)

## How to set the model:

1. Click on the settings icon in the sidebar
2. Enter the model name in the "Model Name" field
3. Click "Save"

After setting the model name, you can start using the chat!
        `
      });
    }

    // Validate and correct model name format
    // The Google Generative AI API expects model names in a specific format
    const validModelNames = [
      'gemini-pro',
      'gemini-pro-vision',
      'gemini-1.0-pro',
      'gemini-1.0-pro-vision',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro-vision'
    ];

    // Check if the model name is valid
    if (!validModelNames.includes(modelName)) {
      // Try to correct common mistakes
      if (modelName.includes('gemini') && !modelName.startsWith('gemini-')) {
        modelName = 'gemini-' + modelName.split('gemini')[1];
      }

      // If still not valid, default to gemini-1.5-pro
      if (!validModelNames.includes(modelName)) {
        console.warn(`Invalid model name "${modelName}" provided. Defaulting to "gemini-1.5-pro"`);
        modelName = 'gemini-1.5-pro';
      }
    }

    console.log(`Using model: ${modelName}`);
    const genAI = new GoogleGenerativeAIType(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const generationConfig: GenerationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings: SafetySetting[] = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
    });

    const result = await chat.sendMessage(prompt);
    const response = result.response;
    return NextResponse.json({ response: response.text() });
  } catch (error) {
    console.error("Error in gemini API route:", error);
    const errorMessage = (error as Error).message;

    // Check for specific error messages and provide helpful responses
    if (errorMessage.includes("Must provide a model name") || errorMessage.includes("unexpected model name format")) {
      return NextResponse.json({
        response: `
# Model Configuration Error

The model name is not properly configured. Please update your settings:

1. Click on the settings icon in the sidebar
2. Enter a valid model name from this list:
   - gemini-1.5-flash (recommended for speed)
   - gemini-1.5-pro (recommended for quality)
   - gemini-pro (legacy model)
   - gemini-1.5-pro-vision (for image processing)
3. Click "Save"

**Important**: Make sure to use the exact format shown above, including the hyphens.

After updating the model name, you can start using the chat!
        `
      });
    }

    if (errorMessage.includes("API key")) {
      return NextResponse.json({
        response: `
# API Key Error

There was an issue with your Gemini API key. Please check your settings:

1. Click on the settings icon in the sidebar
2. Verify your API key is correct
3. Click "Save"

If the problem persists, try generating a new API key at [Google AI Studio](https://makersuite.google.com/app/apikey).
        `
      });
    }

    // For other errors, return a more detailed generic message
    return NextResponse.json({
      response: `
# Something went wrong

There was an error processing your request: ${errorMessage}

## Troubleshooting steps:

1. Check your model name format - it should be exactly one of these:
   - gemini-1.5-flash
   - gemini-1.5-pro
   - gemini-pro
   - gemini-1.5-pro-vision

2. Verify your API key is valid and has access to the model you're trying to use

3. If you're using a newer model like gemini-1.5-flash, make sure your API key has access to it

Please update your settings and try again. If the problem persists, it might be an issue with the Gemini API service.
      `
    });
  }
}
