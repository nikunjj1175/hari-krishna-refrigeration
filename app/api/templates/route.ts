import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import MessageTemplate from '@/models/MessageTemplate';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';
import { templateSchema } from '@/lib/validation/campaign';

export async function GET() {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const templates = await MessageTemplate.find()
      .populate('media')
      .sort({ createdAt: -1 })
      .lean();
    return successResponse(templates);
  } catch {
    return errorResponse('Failed to fetch templates');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const body = await req.json();
    const parsed = templateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.flatten());
    }

    const template = await MessageTemplate.create(parsed.data);
    const populated = await MessageTemplate.findById(template._id).populate('media').lean();
    return successResponse(populated, 201);
  } catch {
    return errorResponse('Failed to create template');
  }
}
