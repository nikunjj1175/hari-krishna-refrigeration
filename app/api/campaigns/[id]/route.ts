import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Campaign from '@/models/Campaign';
import CampaignRecipient from '@/models/CampaignRecipient';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';
import { campaignSchema } from '@/lib/validation/campaign';
import { resolveAudience } from '@/lib/campaign/audience';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const campaign = await Campaign.findById(params.id)
      .populate('targetCategories')
      .populate('targetCustomers')
      .populate('media')
      .lean();
    if (!campaign) return errorResponse('Campaign not found', 404);
    return successResponse(campaign);
  } catch {
    return errorResponse('Failed to fetch campaign');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const existing = await Campaign.findById(params.id);
    if (!existing) return errorResponse('Campaign not found', 404);
    if (existing.status === 'sending') {
      return errorResponse('Cannot edit a campaign that is currently sending', 400);
    }

    const body = await req.json();
    const parsed = campaignSchema.partial().safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.flatten());
    }

    const data = parsed.data;
    const update: Record<string, unknown> = { ...data };
    if (data.targetType || data.targetCategories || data.targetCustomers) {
      const audience = await resolveAudience({
        targetType: data.targetType || existing.targetType,
        targetCategories: data.targetCategories || existing.targetCategories.map(String),
        targetCustomers: data.targetCustomers || existing.targetCustomers.map(String),
      });
      update.totalRecipients = audience.length;
    }
    await Campaign.findByIdAndUpdate(params.id, update);

    const campaign = await Campaign.findById(params.id)
      .populate('targetCategories')
      .populate('media')
      .lean();
    return successResponse(campaign);
  } catch {
    return errorResponse('Failed to update campaign');
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const campaign = await Campaign.findById(params.id);
    if (!campaign) return errorResponse('Campaign not found', 404);
    if (campaign.status === 'sending') {
      return errorResponse('Cannot delete a campaign that is currently sending', 400);
    }

    await CampaignRecipient.deleteMany({ campaignId: params.id });
    await Campaign.findByIdAndDelete(params.id);
    return successResponse({ message: 'Campaign deleted' });
  } catch {
    return errorResponse('Failed to delete campaign');
  }
}
