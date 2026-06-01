import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getNebulaDBHelper } from '@/db/nebuladb-helper';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { initializeDatabase, getCollections } from '@/db/nebuladb';

const MODEL_ROUTES: Record<string, 'gemini' | 'deepseek' | 'openai' | 'anthropic'> = {
  'gemini-2.5-flash': 'gemini',
  'gemini-2.0-flash': 'gemini',
  'deepseek-chat': 'deepseek',
  'gpt-4o': 'openai',
  'claude-3-5-sonnet': 'anthropic',
};

async function buildNoteContext(userId: string, message: string): Promise<string> {
  try {
    const noteRefs = message.match(/\[\[([^\]]+)\]\]/g);
    if (!noteRefs) return '';

    const cols = await getCollections();
    const noteTitles = noteRefs.map(r => r.slice(2, -2).toLowerCase());
    const notes = await (cols as any).notes.find({ user_id: parseInt(userId) }).toArray();
    const matched = notes.filter((n: any) =>
      noteTitles.some(t => n.title?.toLowerCase().includes(t))
    );

    if (!matched.length) return '';

    return `\nReferenced notes:\n${matched.map((n: any) =>
      `--- ${n.title} ---\n${n.content?.slice(0, 2000)}`
    ).join('\n\n')}`;
  } catch (error) {
    console.error('Error building note context:', error);
    return '';
  }
}

async function buildSystemPrompt(userId: string, userMessage?: string): Promise<string> {
  try {
    const db = await getNebulaDBHelper();
    const [nodes, interests, goals, traits] = await Promise.all([
      db.getRecentMemoryNodes(userId, 15),
      db.getTopInterests(userId, 5),
      db.getActiveGoals(userId),
      db.getPersonalityTraits(userId),
    ]);

    if (!nodes.length && !interests.length) return '';

    return `You are a personal AI assistant with persistent memory about this user.

Known interests: ${interests.map((i: any) => i.topic).join(', ')}
Active goals: ${goals.map((g: any) => g.description).join(' | ')}
Personality: ${traits.map((t: any) => t.trait || t.trait_label).join(', ')}
Recent topics: ${nodes.map((n: any) => n.label).join(', ')}

Use this context to personalize your responses naturally — don't narrate or recite it,
just let it inform your tone, examples, and recommendations.`;
  } catch (error) {
    console.error('Error building system prompt:', error);
    return '';
  }
}

async function routeToProvider(provider: string, message: string, systemPrompt: string): Promise<string> {
  const fullMessage = systemPrompt ? `${systemPrompt}\n\nUser: ${message}` : message;

  switch (provider) {
    case 'gemini': {
      const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!googleApiKey) throw new Error('Gemini API key not configured');
      const modelName = process.env.NEXT_PUBLIC_MODEL_NAME || 'gemini-2.5-flash';
      const genAI = new GoogleGenerativeAI(googleApiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(fullMessage);
      return result.response.text();
    }

    case 'deepseek': {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) throw new Error('DeepSeek API key not configured');
      const url = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
            { role: 'user' as const, content: message }
          ],
          temperature: 0.7,
        }),
      });
      if (!res.ok) throw new Error(`DeepSeek responded with ${res.status}`);
      const data = await res.json();
      return data.choices[0]?.message?.content || 'No response from DeepSeek';
    }

    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('OpenAI API key not configured');
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
            { role: 'user' as const, content: message }
          ],
          temperature: 0.7,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI responded with ${res.status}`);
      const data = await res.json();
      return data.choices[0]?.message?.content || 'No response from OpenAI';
    }

    case 'anthropic': {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('Anthropic API key not configured');
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          system: systemPrompt || undefined,
          messages: [{ role: 'user', content: message }],
        }),
      });
      if (!res.ok) throw new Error(`Anthropic responded with ${res.status}`);
      const data = await res.json();
      return data.content?.[0]?.text || 'No response from Claude';
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function getUserId(): string | null {
  const token = cookies().get('gemini-auth-token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded ? decoded.userId.toString() : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message || body.prompt;
    const model = body.model || process.env.NEXT_PUBLIC_MODEL_NAME || 'gemini-2.5-flash';

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await initializeDatabase();
    const userId = getUserId();
    const noteContext = userId ? await buildNoteContext(userId, message) : '';
    const systemPrompt = userId ? await buildSystemPrompt(userId, message) : '';
    const fullSystemPrompt = noteContext ? `${systemPrompt}\n\n${noteContext}` : systemPrompt;
    const provider = MODEL_ROUTES[model] || 'gemini';

    let responseText: string;
    try {
      const currentProvider = provider === 'gemini' && userId ? provider : provider;
      responseText = await routeToProvider(currentProvider, message, fullSystemPrompt);
    } catch (providerError) {
      console.error(`Provider ${provider} failed, trying fallback:`, providerError);
      try {
        responseText = await routeToProvider('deepseek', message, fullSystemPrompt);
      } catch {
        responseText = `# Service Unavailable\n\nBoth primary and fallback providers are currently unavailable. Please check your API keys.`;
      }
    }

    const response = NextResponse.json({
      response: responseText,
      provider,
      model,
    });

    if (userId && responseText) {
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/memory/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userMessage: message, aiResponse: responseText }),
      }).catch(err => console.error('Background extraction error:', err));
    }

    return response;
  } catch (error) {
    console.error('Chat route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
