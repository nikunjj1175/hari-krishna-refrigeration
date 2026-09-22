import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';
import { z } from 'zod';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await validateSession();
    if (error) return error;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse('Validation failed', 400, parsed.error.flatten());

    await connectDB();
    const user = await User.findById(session!.user.id);
    if (!user) return errorResponse('User not found', 404);

    const ok = await user.comparePassword(parsed.data.currentPassword);
    if (!ok) return errorResponse('Current password is incorrect', 400);

    user.password = parsed.data.newPassword;
    await user.save();
    return successResponse({ message: 'Password updated' });
  } catch {
    return errorResponse('Failed to update password');
  }
}
