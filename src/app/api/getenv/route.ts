import { db, collections } from '@/database/nebuladb';

import { NextRequest, NextResponse } from 'next/server';
import { getNebulaDBHelper } from '@/database/nebuladb-helper';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { DecodedToken } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get('gemini-auth-token')?.value;

    // If no token, return public settings only
    let userId: number | null = null;
    if (token) {
      const decoded = verifyToken(token) as DecodedToken | null;
      if (decoded) {
        userId = Number(decoded.userId);
      }
    }

    // Get RxDB helper instance
    const dbHelper = await getNebulaDBHelper();

    // Get key from URL
    const { searchParams } = new URL(request.url);
    const key: string = searchParams.get('key') || '';

    // If no key provided, return all settings
    if (!key) {
      const allSettings: { [key: string]: string } = {};

      // Define all possible setting keys
      const settingKeys = [
        'port', 'geminiKey', 'modelName', 'weaviateURL', 'weaviateKey',
        'serverHost', 'langfuseSecret', 'langfusePublic', 'langfuseBaseURL',
        'langfuseHost', 'embedderUrl'
      ];

      for (const settingKey of settingKeys) {
        let settingValue = '';
        if (userId) {
          // Get user-specific setting
          const setting = await dbHelper.getSetting(userId, settingKey);
          if (setting) {
            settingValue = setting.value || '';
          }
        }

        // If no user-specific setting, try to get a global setting (user_id = null)
        if (!settingValue) {
          const settings = await dbHelper.getSettings(null as any);
          const globalSetting = settings.find((s: any) => s.key === settingKey);
          if (globalSetting) {
            settingValue = globalSetting.value || '';
          }
        }

        // For unauthenticated requests or if setting not found, provide default values
        if (!settingValue) {
          // Return default values for certain keys
          if (settingKey === 'modelName') {
            settingValue = 'gemini-1.5-pro';
          } else if (settingKey === 'geminiKey') {
            settingValue = '';
          } else if (settingKey === 'theme') {
            settingValue = 'light';
          } else {
            settingValue = '';
          }
        }

        allSettings[settingKey] = settingValue;
      }

      return NextResponse.json(allSettings);
    }

    // Get the setting
    let settingValue = '';
    if (userId) {
      // Get user-specific setting
      const setting = await dbHelper.getSetting(userId, key);
      if (setting) {
        settingValue = setting.value || '';
      }
    }

    // If no user-specific setting, try to get a global setting
    if (!settingValue) {
      const settings = await dbHelper.getSettings(null as any);
      const globalSetting = settings.find((s: any) => s.key === key);
      if (globalSetting) {
        settingValue = (globalSetting.value || '') as string;
      }
    }

    // For unauthenticated requests or if setting not found, provide default values
    if (!settingValue) {
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

    return NextResponse.json({ value: settingValue });
  } catch (error) {
    console.error('Get setting error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
