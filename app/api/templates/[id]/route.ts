import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import MessageTemplate from '@/models/MessageTemplate';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';
import { templateSchema } from '@/lib/validation/campaign';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;
    await connectDB();
    const template = await MessageTemplate.findById(params.id).populate('media').lean();
    if (!template) return errorResponse('Template not found', 404);
    return successResponse(template);
  } catch {
    return errorResponse('Failed to fetch template');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;
    await connectDB();
    const body = await req.json();
    const parsed = templateSchema.partial().safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.flatten());
    }
    const template = await MessageTemplate.findByIdAndUpdate(params.id, parsed.data, {
      new: true,
    }).populate('media');
    if (!template) return errorResponse('Template not found', 404);
    return successResponse(template);
  } catch {
    return errorResponse('Failed to update template');
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;
    await connectDB();
    const template = await MessageTemplate.findByIdAndDelete(params.id);
    if (!template) return errorResponse('Template not found', 404);
    return successResponse({ message: 'Template deleted' });
  } catch {
    return errorResponse('Failed to delete template');
  }
}
