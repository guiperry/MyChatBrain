import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get token from cookies
  const token = request.cookies.get('gemini-auth-token')?.value;
  
  // Check if the request is for an API route that requires authentication
  if (request.nextUrl.pathname.startsWith('/api/auth/me') ||
      request.nextUrl.pathname.startsWith('/api/auth/change-password') ||
      request.nextUrl.pathname.startsWith('/api/auth/logout') ||
      request.nextUrl.pathname.startsWith('/api/deleteChat') ||
      request.nextUrl.pathname.startsWith('/api/setenv')) {
    
    // If no token, return 401
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    // If there is a token, continue
    return NextResponse.next();
  }
  
  // Check if the request is for a page that requires authentication
  if (request.nextUrl.pathname === '/') {
    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // If there is a token, continue
    return NextResponse.next();
  }
  
  // Check if the request is for login/register pages and user is already logged in
  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') {
    // If token exists, redirect to home
    if (token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // If there is no token, continue
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