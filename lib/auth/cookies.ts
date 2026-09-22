import { NextResponse } from 'next/server';
import { JWT_COOKIE_NAME, JWT_MAX_AGE_SECONDS } from './constants';

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: JWT_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(JWT_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
