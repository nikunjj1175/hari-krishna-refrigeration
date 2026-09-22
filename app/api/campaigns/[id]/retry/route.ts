import { NextRequest } from 'next/server';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';
import { retryFailedRecipients } from '@/lib/whatsapp/campaignProcessor';
import Campaign from '@/models/Campaign';
import connectDB from '@/lib/db/mongoose';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const campaign = await Campaign.findById(params.id);
    if (!campaign) return errorResponse('Campaign not found', 404);

    await retryFailedRecipients(params.id);
    return successResponse({ message: 'Retry started for failed messages' });
  } catch {
    return errorResponse('Failed to retry campaign');
  }
}
