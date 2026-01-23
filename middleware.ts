import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './auth';

/**
 * Iron Gate Middleware - Only SUPER_ADMIN role can access this admin app.
 * This is the first line of defense for admin.infradyn.com
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes (login, invite acceptance, static assets)
  const publicRoutes = ['/login', '/invite', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get session
  const session = await auth.api.getSession({
    headers: request.headers
  });

  // No session - redirect to login
  if (!session || !session.user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = session.user as { role?: string; isSuspended?: boolean };

  // Check for SUPER_ADMIN role
  if (user.role !== 'SUPER_ADMIN') {
    // Not a super admin - show access denied
    return NextResponse.redirect(new URL('/login?error=access_denied', request.url));
  }

  // Check if user is suspended
  if (user.isSuspended) {
    return NextResponse.redirect(new URL('/login?error=account_suspended', request.url));
  }

  // All checks passed - allow access
  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except static files and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
