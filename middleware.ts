import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { JWT_COOKIE_NAME } from '@/lib/auth/constants';
import { extractToken } from '@/lib/auth/token';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const token =
    req.cookies.get(JWT_COOKIE_NAME)?.value ||
    extractToken(req.headers.get('cookie'), req.headers.get('authorization'));

  if (!token) {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const login = new URL('/login', req.url);
    login.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  try {
    await jwtVerify(token, getJwtSecret());
    return NextResponse.next();
  } catch {
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/customers/:path*',
    '/categories/:path*',
    '/campaigns/:path*',
    '/templates/:path*',
    '/media/:path*',
    '/messages/:path*',
    '/settings/:path*',
    '/api/customers/:path*',
    '/api/categories/:path*',
    '/api/machines/:path*',
    '/api/campaigns/:path*',
    '/api/templates/:path*',
    '/api/media/:path*',
    '/api/messages/:path*',
    '/api/settings/:path*',
    '/api/dashboard/:path*',
  ],
};
