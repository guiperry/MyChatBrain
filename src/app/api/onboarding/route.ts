import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/db/nebuladb-helper';
import { getCollections } from '@/db/nebuladb';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

function getUserId(): number | null {
  const token = cookies().get('gemini-auth-token')?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.userId ?? null;
}

export async function GET() {
  try {
    const userId = getUserId();
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const cols = await getCollections();
    const setting = await (cols as any).settings.findOne({
      user_id: userId,
      key: 'onboarding_completed'
    });

    return NextResponse.json({
      onboardingComplete: setting?.value === 'true',
      completedAt: setting?.updated_at || null
    });
  } catch (error) {
    console.error('Onboarding GET error:', error);
    return NextResponse.json({ onboardingComplete: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId();
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { displayName, interests, experience } = body;

    const cols = await getCollections();
    const now = new Date().toISOString();

    const existing = await (cols as any).settings.findOne({
      user_id: userId,
      key: 'onboarding_completed'
    });

    if (existing) {
      await (cols as any).settings.update(
        { user_id: userId, key: 'onboarding_completed' },
        { $set: { value: 'true', updated_at: now } }
      );
    } else {
      await (cols as any).settings.insert({
        user_id: userId,
        key: 'onboarding_completed',
        value: 'true',
        created_at: now,
        updated_at: now
      });
    }

    if (displayName) {
      const existingName = await (cols as any).settings.findOne({
        user_id: userId,
        key: 'display_name'
      });
      if (existingName) {
        await (cols as any).settings.update(
          { user_id: userId, key: 'display_name' },
          { $set: { value: displayName, updated_at: now } }
        );
      } else {
        await (cols as any).settings.insert({
          user_id: userId,
          key: 'display_name',
          value: displayName,
          created_at: now,
          updated_at: now
        });
      }
    }

    if (interests?.length) {
      const db = await getNebulaDBHelper();
      for (const interest of interests) {
        await db.createMemoryNode({
          label: interest,
          type: 'topic',
          user_id: userId,
          metadata: JSON.stringify({ source: 'onboarding', interestStrength: 1.0 })
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding POST error:', error);
    return NextResponse.json({ error: 'Failed to save onboarding' }, { status: 500 });
  }
}
