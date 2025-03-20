import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/forgot-password'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // If the user is not authenticated and trying to access a protected route
  if (!token && !publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is authenticated and trying to access login/signup pages
  if (token && publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths except for:
  // - API routes
  // - Static files (images, etc.)
  // - Favicon
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};