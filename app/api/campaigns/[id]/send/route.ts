import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Campaign from '@/models/Campaign';
import CampaignRecipient from '@/models/CampaignRecipient';
import Machine from '@/models/Machine';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';
import { resolveAudience } from '@/lib/campaign/audience';
import { renderCustomerMessage } from '@/lib/whatsapp/interpolate';
import { processCampaign } from '@/lib/whatsapp/campaignProcessor';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    const limited = rateLimit(`campaign-send-${params.id}`, 3, 60_000);
    if (!limited.success) return errorResponse('Campaign send already in progress', 429);

    await connectDB();
    const campaign = await Campaign.findById(params.id);
    if (!campaign) return errorResponse('Campaign not found', 404);
    if (campaign.status === 'sending') {
      return errorResponse('Campaign is already sending', 400);
    }

    const audience = await resolveAudience({
      targetType: campaign.targetType,
      targetCategories: campaign.targetCategories.map(String),
      targetCustomers: campaign.targetCustomers.map(String),
    });

    if (audience.length === 0) {
      return errorResponse('No active customers match this audience', 400);
    }

    await CampaignRecipient.deleteMany({ campaignId: campaign._id });

    const docs = [];
    for (const customer of audience) {
      const machines = await Machine.find({ customerId: customer._id }).lean();
      docs.push({
        campaignId: campaign._id,
        customerId: customer._id,
        whatsappNumber: customer.whatsappNumber,
        message: renderCustomerMessage(campaign.message, customer, machines),
        status: 'pending',
      });
    }

    await CampaignRecipient.insertMany(docs);
    await Campaign.findByIdAndUpdate(campaign._id, {
      status: 'sending',
      totalRecipients: docs.length,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      startedAt: new Date(),
    });

    void processCampaign(campaign._id.toString());

    return successResponse({
      message: 'Campaign queued for sending',
      totalRecipients: docs.length,
    });
  } catch (err) {
    console.error('POST /api/campaigns/[id]/send', err);
    return errorResponse('Failed to start campaign');
  }
}
