export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthSession {
  user: AuthUser;
}

export interface JwtPayload extends AuthUser {
  iat?: number;
  exp?: number;
}
