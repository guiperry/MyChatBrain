import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getNebulaDBHelper } from '@/db/nebuladb-helper';
import { initializeDatabase } from '@/db/nebuladb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userMessage, aiResponse } = body;

    if (!userId || !userMessage) {
      return NextResponse.json({ error: 'userId and userMessage are required' }, { status: 400 });
    }

    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!googleApiKey) return NextResponse.json({ error: 'No API key' }, { status: 200 });

    const extractionPrompt = `From this conversation exchange, extract structured data.
Return JSON only, no markdown:
{
  "topics": ["string"],
  "entities": ["string"],
  "interests": [{"topic": "string", "strength": 0.0-1.0}],
  "goals": ["string"],
  "sentiment": "positive"|"neutral"|"negative"
}

User said: ${userMessage}
AI responded: ${aiResponse}`;

    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(extractionPrompt);
    const text = result.response.text();

    let extracted: any;
    try {
      const cleaned = text.replace(/```(json)?/g, '').trim();
      extracted = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse extraction response:', text);
      return NextResponse.json({ error: 'Parse failed' }, { status: 200 });
    }

    await initializeDatabase();
    const db = await getNebulaDBHelper();

    const now = new Date().toISOString();

    if (extracted.topics && Array.isArray(extracted.topics)) {
      for (const topic of extracted.topics) {
        const existing = await (db as any).findMemoryNode(topic, 'topic', parseInt(userId));
        if (!existing || existing.length === 0) {
          await db.createMemoryNode({
            label: topic,
            type: 'topic',
            user_id: parseInt(userId),
            metadata: JSON.stringify({ source: 'extraction', extractedAt: now })
          });
        }
      }
    }

    if (extracted.entities && Array.isArray(extracted.entities)) {
      for (const entity of extracted.entities) {
        const existing = await (db as any).findMemoryNode(entity, 'entity', parseInt(userId));
        if (!existing || existing.length === 0) {
          await db.createMemoryNode({
            label: entity,
            type: 'entity',
            user_id: parseInt(userId),
            metadata: JSON.stringify({ source: 'extraction', extractedAt: now })
          });
        }
      }
    }

    if (extracted.interests && Array.isArray(extracted.interests)) {
      const cols = await (await import('@/db/nebuladb')).getCollections();
      for (const interest of extracted.interests) {
        const existing = await (cols as any).interest_metrics.findOne({
          user_id: parseInt(userId),
          topic: interest.topic
        });
        if (existing) {
          await (cols as any).interest_metrics.update(
            { user_id: parseInt(userId), topic: interest.topic },
            { $set: { weight: interest.strength, last_updated: now } }
          );
        } else {
          await (cols as any).interest_metrics.insert({
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            user_id: parseInt(userId),
            topic: interest.topic,
            weight: interest.strength,
            decay_factor: 0.9,
            last_updated: now,
            created_at: now
          });
        }
      }
    }

    if (extracted.goals && Array.isArray(extracted.goals)) {
      const cols = await (await import('@/db/nebuladb')).getCollections();
      for (const goalDesc of extracted.goals) {
        const existing = await (cols as any).goal_metrics.findOne({
          user_id: parseInt(userId),
          description: goalDesc,
          status: 'active'
        });
        if (!existing) {
          await (cols as any).goal_metrics.insert({
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            user_id: parseInt(userId),
            description: goalDesc,
            status: 'active',
            confidence: 0.5,
            created_at: now,
            updated_at: now
          });
        }
      }
    }

    return NextResponse.json({ success: true, extracted });
  } catch (error) {
    console.error('Memory extraction error:', error);
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}
