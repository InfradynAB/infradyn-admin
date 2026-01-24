import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple session cookie check for Edge Runtime
// Full session validation happens in API routes/server components
const SESSION_COOKIE_NAME = 'better-auth.session_token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname.startsWith('/login') || 
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt'
  ) {
    return NextResponse.next();
  }

  // Check for session cookie existence (basic auth gate)
  // Full validation happens server-side
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionToken?.value) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
