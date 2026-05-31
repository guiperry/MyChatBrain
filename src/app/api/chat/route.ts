import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message || body.prompt;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    const modelName = process.env.NEXT_PUBLIC_MODEL_NAME || 'gemini-2.5-flash';

    // Primary: Gemini
    if (googleApiKey) {
      try {
        const genAI = new GoogleGenerativeAI(googleApiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(message);
        return NextResponse.json({
          response: result.response.text(),
          provider: 'gemini',
          model: modelName,
        });
      } catch (geminiError) {
        console.error('Gemini failed, trying DeepSeek fallback:', geminiError);
      }
    }

    // Fallback: DeepSeek
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    const deepseekUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1/chat/completions';

    if (deepseekApiKey) {
      try {
        const res = await fetch(deepseekUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekApiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: message }],
            temperature: 0.7,
          }),
        });

        if (!res.ok) throw new Error(`DeepSeek responded with ${res.status}`);

        const data = await res.json();
        return NextResponse.json({
          response: data.choices[0]?.message?.content || 'No response from DeepSeek',
          provider: 'deepseek',
          model: 'deepseek-chat',
        });
      } catch (deepseekError) {
        console.error('DeepSeek fallback also failed:', deepseekError);
        return NextResponse.json({
          response: '# Service Unavailable\n\nBoth Gemini and DeepSeek are currently unavailable. Please check that your API keys are valid and try again.',
        });
      }
    }

    // No providers configured
    return NextResponse.json({
      response: '# API Keys Required\n\nNo AI provider is configured. Please set `NEXT_PUBLIC_GOOGLE_API_KEY` or `DEEPSEEK_API_KEY` in your Vercel environment variables.',
    });

  } catch (error) {
    console.error('Chat route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
