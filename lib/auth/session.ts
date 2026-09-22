import { cookies, headers } from 'next/headers';
import { JWT_COOKIE_NAME } from './constants';
import { verifyAuthToken } from './jwt';
import { extractToken } from './token';
import type { AuthSession, AuthUser } from '@/types/auth';

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const headerStore = headers();
  const token =
    cookieStore.get(JWT_COOKIE_NAME)?.value ||
    extractToken(headerStore.get('cookie'), headerStore.get('authorization'));
  if (!token) return null;
  return verifyAuthToken(token);
}

export async function getSession(): Promise<AuthSession | null> {
  const user = await getAuthUser();
  return user ? { user } : null;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
