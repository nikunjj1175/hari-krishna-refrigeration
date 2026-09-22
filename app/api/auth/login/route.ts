import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import { errorResponse, successResponse } from '@/lib/utils/api';
import { rateLimit } from '@/lib/rate-limit';
import { signAuthToken } from '@/lib/auth/jwt';
import { setAuthCookie } from '@/lib/auth/cookies';
import { JWT_EXPIRES_IN, JWT_MAX_AGE_SECONDS } from '@/lib/auth/constants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    const limited = rateLimit(`login-${email}`, 8, 60_000);
    if (!limited.success) {
      return errorResponse('Too many login attempts. Please try again shortly.', 429);
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return errorResponse('Invalid email or password', 401);
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return errorResponse('Invalid email or password', 401);
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const authUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const token = await signAuthToken(authUser);
    const res = successResponse({
      token,
      expiresIn: JWT_EXPIRES_IN,
      maxAge: JWT_MAX_AGE_SECONDS,
      user: authUser,
    });
    setAuthCookie(res, token);
    return res;
  } catch (err) {
    console.error('POST /api/auth/login', err);
    return errorResponse('Login failed');
  }
}
