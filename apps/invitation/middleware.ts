import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Redirect legacy client-dashboard URLs to new dashboard structure
  const redirects: Record<string, string> = {
    '/client-dashboard': '/dashboard',
    '/client-dashboard/login': '/dashboard/login',
  };

  // Direct redirect for exact matches
  if (redirects[path]) {
    return NextResponse.redirect(new URL(redirects[path], request.url));
  }

  // For other client-dashboard paths, redirect to dashboard
  // User will need to select event from dashboard
  if (path.startsWith('/client-dashboard/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/client-dashboard/:path*'],
};
