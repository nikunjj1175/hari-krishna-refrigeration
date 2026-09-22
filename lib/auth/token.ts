import { JWT_COOKIE_NAME } from './constants';

export function extractToken(cookieHeader?: string | null, authHeader?: string | null) {
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').find((part) => part.trim().startsWith(`${JWT_COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=').trim()) : null;
}
