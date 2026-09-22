import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth/cookies';

export async function POST() {
  const res = NextResponse.json({ success: true, data: { message: 'Signed out' } });
  clearAuthCookie(res);
  return res;
}
