import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';
import { resolveAudience } from '@/lib/campaign/audience';
import { z } from 'zod';

const schema = z.object({
  targetType: z.enum(['all', 'category', 'individual']),
  targetCategories: z.array(z.string()).optional(),
  targetCustomers: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse('Validation failed', 400);

    const audience = await resolveAudience(parsed.data);
    return successResponse({
      count: audience.length,
      preview: audience.slice(0, 8).map((c) => ({
        _id: c._id,
        name: c.name,
        businessName: c.businessName,
        whatsappNumber: c.whatsappNumber,
      })),
    });
  } catch {
    return errorResponse('Failed to preview audience');
  }
}
