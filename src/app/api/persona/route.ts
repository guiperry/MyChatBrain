import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PersonaOrchestrator } from '@/lib/persona/personaOrchestrator';

/**
 * GET /api/persona - Get persona snapshot for current user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const snapshot = await PersonaOrchestrator.getPersonaSnapshot(user.id);

    return NextResponse.json({
      success: true,
      persona: snapshot
    });

  } catch (error) {
    console.error('Error fetching persona:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch persona data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/persona - Initialize persona for current user
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const initialized = await PersonaOrchestrator.initializeUser(user.id);

    if (initialized) {
      return NextResponse.json({
        success: true,
        message: 'Persona initialized successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to initialize persona' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error initializing persona:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize persona' },
      { status: 500 }
    );
  }
}
