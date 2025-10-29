import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { DecodedToken } from '@/types';
import { typedGet } from '@/db/types';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get('gemini-auth-token')?.value;

    // If no token, return public settings only
    let userId = null;
    if (token) {
      const decoded = verifyToken(token) as DecodedToken | null;
      if (decoded) {
        userId = decoded.userId;
      }
    }

    // Get key from URL
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    // If no key provided, return all settings
    if (!key) {
      const allSettings: { [key: string]: string } = {};

      // Define all possible setting keys
      const settingKeys = [
        'port', 'geminiKey', 'modelName', 'weaviateURL', 'weaviateKey',
        'serverHost', 'langfuseSecret', 'langfusePublic', 'langfuseBaseURL',
        'langfuseHost', 'pineconeKey', 'pineconeEnvironment', 'pineconeIndex'
      ];

      for (const settingKey of settingKeys) {
        let setting: { value: string } | undefined;
        if (userId) {
          // Get user-specific setting
          setting = typedGet<{ value: string }>(
            db,
            'SELECT * FROM settings WHERE user_id = ? AND key = ?',
            [userId, settingKey]
          );
        }

        // If no user-specific setting, try to get a global setting
        if (!setting) {
          setting = typedGet<{ value: string }>(
            db,
            'SELECT * FROM settings WHERE user_id = 0 AND key = ?',
            [settingKey]
          );
        }

        // For unauthenticated requests or if setting not found, provide default values
        if (!setting) {
          // Return default values for certain keys
          if (settingKey === 'modelName') {
            allSettings[settingKey] = 'gemini-1.5-pro';
          } else if (settingKey === 'geminiKey') {
            allSettings[settingKey] = '';
          } else if (settingKey === 'theme') {
            allSettings[settingKey] = 'light';
          } else {
            allSettings[settingKey] = '';
          }
        } else {
          allSettings[settingKey] = setting.value;
        }
      }

      return NextResponse.json(allSettings);
    }

    // Get the setting
    let setting: { value: string } | undefined;
    if (userId) {
      // Get user-specific setting
      setting = typedGet<{ value: string }>(
        db,
        'SELECT * FROM settings WHERE user_id = ? AND key = ?',
        [userId, key]
      );
    }

    // If no user-specific setting, try to get a global setting
    if (!setting) {
      setting = typedGet<{ value: string }>(
        db,
        'SELECT * FROM settings WHERE user_id = 0 AND key = ?',
        [key]
      );
    }

    // For unauthenticated requests or if setting not found, provide default values
    if (!setting) {
      // Return default values for certain keys
      if (key === 'model') {
        return NextResponse.json({ value: 'gemini-1.5-pro' });
      } else if (key === 'apiKey') {
        return NextResponse.json({ value: '' });
      } else if (key === 'theme') {
        return NextResponse.json({ value: 'light' });
      } else {
        return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ value: setting.value });
  } catch (error) {
    console.error('Get setting error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
