import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Better Auth cookie names vary by environment
// Production (HTTPS): __Secure-better-auth.session_token
// Development (HTTP): better-auth.session_token
const SESSION_COOKIE_NAMES = [
  '__Secure-better-auth.session_token',
  'better-auth.session_token',
];

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
  const hasSessionCookie = SESSION_COOKIE_NAMES.some(
    name => request.cookies.get(name)?.value
  );

  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
