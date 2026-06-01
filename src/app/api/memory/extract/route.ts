import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getNebulaDBHelper } from '@/db/nebuladb-helper';
import { initializeDatabase } from '@/db/nebuladb';
import { indexEntry } from '@/lib/embeddingIndex';

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
          const node = await db.createMemoryNode({
            label: topic,
            type: 'topic',
            user_id: parseInt(userId),
            metadata: JSON.stringify({ source: 'extraction', extractedAt: now })
          });
          // Index the new node as an embedding (fire-and-forget, errors logged not thrown)
          if (node?.id) {
            indexEntry(`node-${node.id}`, userId, 'memory_node', topic, { type: 'topic' })
              .catch(err => console.error('embed memory_node failed:', err));
          }
        }
      }
    }

    if (extracted.entities && Array.isArray(extracted.entities)) {
      for (const entity of extracted.entities) {
        const existing = await (db as any).findMemoryNode(entity, 'entity', parseInt(userId));
        if (!existing || existing.length === 0) {
          const node = await db.createMemoryNode({
            label: entity,
            type: 'entity',
            user_id: parseInt(userId),
            metadata: JSON.stringify({ source: 'extraction', extractedAt: now })
          });
          if (node?.id) {
            indexEntry(`node-${node.id}`, userId, 'memory_node', entity, { type: 'entity' })
              .catch(err => console.error('embed memory_node failed:', err));
          }
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
          // Re-index with updated weight
          indexEntry(`interest-${existing.id}`, userId, 'interest', interest.topic, { weight: interest.strength, topic: interest.topic })
            .catch(err => console.error('embed interest update failed:', err));
        } else {
          const id = Date.now().toString() + Math.random().toString(36).slice(2);
          await (cols as any).interest_metrics.insert({
            id,
            user_id: parseInt(userId),
            topic: interest.topic,
            weight: interest.strength,
            decay_factor: 0.9,
            last_updated: now,
            created_at: now
          });
          indexEntry(`interest-${id}`, userId, 'interest', interest.topic, { weight: interest.strength, topic: interest.topic })
            .catch(err => console.error('embed interest insert failed:', err));
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
          const id = Date.now().toString() + Math.random().toString(36).slice(2);
          await (cols as any).goal_metrics.insert({
            id,
            user_id: parseInt(userId),
            description: goalDesc,
            status: 'active',
            confidence: 0.5,
            created_at: now,
            updated_at: now
          });
          indexEntry(`goal-${id}`, userId, 'goal', goalDesc, { status: 'active', confidence: 0.5 })
            .catch(err => console.error('embed goal failed:', err));
        }
      }
    }

    return NextResponse.json({ success: true, extracted });
  } catch (error) {
    console.error('Memory extraction error:', error);
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}
