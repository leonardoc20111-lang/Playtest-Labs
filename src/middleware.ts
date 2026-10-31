import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/config';

/**
 * Lightweight edge guard: it only checks that a session cookie exists so
 * unauthenticated visitors get an immediate redirect. Real authorisation
 * (role checks, record ownership) is always enforced again on the server in
 * layouts/actions against the database.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  url.searchParams.set('next', `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/book'],
};
