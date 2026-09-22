import { successResponse, errorResponse } from '@/lib/utils/api';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return errorResponse('Unauthorized', 401);
  return successResponse(session);
}
