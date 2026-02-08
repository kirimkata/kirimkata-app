import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Redirect legacy client-dashboard URLs to new dashboard structure
  /*
  const redirects: Record<string, string> = {
    '/client-dashboard': '/dashboard',
    '/client-dashboard/login': '/dashboard/login',
  };

  if (redirects[pathname]) {
    return NextResponse.redirect(new URL(redirects[pathname], request.url));
  }

  if (pathname.startsWith('/client-dashboard/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  */

  // Add cache control for invitation pages (slug routes)
  // Match pattern: /slug (not dashboard or admin pages)
  if (
    pathname.match(/^\/[a-z0-9-]+$/) &&
    !pathname.startsWith('/client-dashboard') &&
    !pathname.startsWith('/admin-dashboard') &&
    !pathname.startsWith('/kirimkata-admin')
  ) {
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
