import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 400 }
      );
    }

    const deepseekUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1/chat/completions';

    const response = await fetch(deepseekUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${error}`);
    }

    const data = await response.json();
    return NextResponse.json({ 
      response: data.choices[0]?.message?.content || 'No response from DeepSeek'
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error processing DeepSeek request' },
      { status: 500 }
    );
  }
}