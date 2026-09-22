import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Campaign from '@/models/Campaign';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  validateSession,
  getPaginationParams,
} from '@/lib/utils/api';
import { campaignSchema } from '@/lib/validation/campaign';
import { resolveAudience } from '@/lib/campaign/audience';

export async function GET(req: NextRequest) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const { page, limit, skip } = getPaginationParams(req.url);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (category) filter.targetCategories = category;
    if (from || to) {
      filter.createdAt = {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(`${to}T23:59:59.999Z`) } : {}),
      };
    }

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .populate('targetCategories')
        .populate('media')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Campaign.countDocuments(filter),
    ]);

    return paginatedResponse(campaigns, total, page, limit);
  } catch (err) {
    console.error('GET /api/campaigns', err);
    return errorResponse('Failed to fetch campaigns');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await validateSession();
    if (error) return error;

    await connectDB();
    const body = await req.json();
    const parsed = campaignSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.flatten());
    }

    const audience = await resolveAudience(parsed.data);
    const campaign = await Campaign.create({
      ...parsed.data,
      totalRecipients: audience.length,
      createdBy: session?.user.id,
      status: 'draft',
    });

    const populated = await Campaign.findById(campaign._id)
      .populate('targetCategories')
      .populate('media')
      .lean();

    return successResponse(populated, 201);
  } catch (err) {
    console.error('POST /api/campaigns', err);
    return errorResponse('Failed to create campaign');
  }
}
