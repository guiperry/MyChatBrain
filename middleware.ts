import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// For app-internal JWT, we just check if it looks valid
// In production, use a proper JWKS endpoint
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    if (payload.exp) {
      return payload.exp * 1000 < Date.now();
    }
    return false;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  // Get token from cookies
  const token = request.cookies.get('gemini-auth-token')?.value;

  const protectedApis = [
    '/api/auth/me',
    '/api/auth/change-password',
    '/api/auth/logout',
    '/api/deleteChat',
    '/api/setenv',
    '/api/onboarding',
    '/api/memory',
    '/api/creator-sessions',
  ];

  // Check if the request is for an API route that requires authentication
  if (protectedApis.some(p => request.nextUrl.pathname.startsWith(p))) {
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    // If token is expired, try refresh
    if (isTokenExpired(token)) {
      return NextResponse.json(
        { error: 'Token expired, please re-login' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Allow forgot-password and reset-password without auth
  if (request.nextUrl.pathname.startsWith('/api/auth/forgot-password') ||
      request.nextUrl.pathname.startsWith('/api/auth/reset-password')) {
    return NextResponse.next();
  }

  // Check if the request is for a page that requires authentication
  if (request.nextUrl.pathname === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (isTokenExpired(token)) {
      const response = NextResponse.redirect(new URL('/login?expired=true', request.url));
      response.cookies.delete('gemini-auth-token');
      return response;
    }
    return NextResponse.next();
  }

  // Check if the request is for login/register pages and user is already logged in
  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') {
    if (token && !isTokenExpired(token)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (token && isTokenExpired(token)) {
      const response = NextResponse.next();
      response.cookies.delete('gemini-auth-token');
      return response;
    }
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
    '/api/:path*',
    '/',
    '/login',
    '/register'
  ]
};