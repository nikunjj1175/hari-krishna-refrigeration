import { jwtVerify, SignJWT } from 'jose';
import { JWT_EXPIRES_IN } from './constants';
import type { AuthUser, JwtPayload } from '@/types/auth';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (!payload.id || !payload.email) return null;
    return {
      id: String(payload.id),
      name: String(payload.name || ''),
      email: String(payload.email),
      role: String(payload.role || 'admin'),
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
