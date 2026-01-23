import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Get session
  const session = await auth.api.getSession({
    headers: request.headers
  });

  // No session - go to login
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check role
  const user = session.user as { role?: string };
  if (user.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/login?error=access_denied', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
