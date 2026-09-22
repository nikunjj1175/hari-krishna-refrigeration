import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import CampaignRecipient from '@/models/CampaignRecipient';
import {
  errorResponse,
  paginatedResponse,
  validateSession,
  getPaginationParams,
} from '@/lib/utils/api';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const { page, limit, skip } = getPaginationParams(req.url);
    const status = new URL(req.url).searchParams.get('status') || '';
    const filter: Record<string, unknown> = { campaignId: params.id };
    if (status) filter.status = status;

    const [recipients, total] = await Promise.all([
      CampaignRecipient.find(filter)
        .populate('customerId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CampaignRecipient.countDocuments(filter),
    ]);

    const data = recipients.map((r) => ({
      ...r,
      customer: r.customerId,
    }));

    return paginatedResponse(data, total, page, limit);
  } catch {
    return errorResponse('Failed to fetch recipients');
  }
}
