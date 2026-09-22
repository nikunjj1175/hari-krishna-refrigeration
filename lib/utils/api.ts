import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import type { AuthSession } from '@/types/auth';

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 500, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export function paginatedResponse(
  data: unknown,
  total: number,
  page: number,
  limit: number
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
}

export async function validateSession(): Promise<{
  session: AuthSession | null;
  error: NextResponse | null;
}> {
  const session = await getSession();
  if (!session) {
    return { session: null, error: errorResponse('Unauthorized', 401) };
  }
  return { session, error: null };
}

export function getPaginationParams(url: string) {
  const { searchParams } = new URL(url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
