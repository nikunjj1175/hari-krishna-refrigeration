import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import MessageTemplate from '@/models/MessageTemplate';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;
    await connectDB();
    const original = await MessageTemplate.findById(params.id);
    if (!original) return errorResponse('Template not found', 404);

    const copy = await MessageTemplate.create({
      name: `${original.name} (Copy)`,
      category: original.category,
      message: original.message,
      media: original.media,
      status: original.status,
    });
    const populated = await MessageTemplate.findById(copy._id).populate('media').lean();
    return successResponse(populated, 201);
  } catch {
    return errorResponse('Failed to duplicate template');
  }
}
