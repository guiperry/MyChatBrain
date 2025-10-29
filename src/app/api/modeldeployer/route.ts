import { NextRequest, NextResponse } from 'next/server';

const MODEL_DEPLOYER_URL = 'http://localhost:3000/api/v1/chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model = 'gemini-1.5-flash', options = {} } = body;

    // Forward request to ModelDeployer
    const response = await fetch(MODEL_DEPLOYER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Authentication headers can be added here if needed
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        options: {
          model,
          ...options
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to connect to ModelDeployer');
    }

    const result = await response.json();
    
    return NextResponse.json({ 
      response: result.choices?.[0]?.message?.content || result.response || ''
    });

  } catch (error) {
    console.error("ModelDeployer API error:", error);
    const errorMessage = (error as Error).message;

    return NextResponse.json({
      response: `
# ModelDeployer Connection Error

${errorMessage}

## Setup Instructions:

1. Start ModelDeployer by running:
   \`\`\`bash
   cd ModelDeployer && npm start
   \`\`\`

2. Make sure ModelDeployer is running on port 3000

3. Configure your API keys in ModelDeployer's settings

4. Try your request again
      `
    }, { status: 400 });
  }
}