import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import MessageLog from '@/models/MessageLog';
import CampaignRecipient from '@/models/CampaignRecipient';
import Campaign from '@/models/Campaign';
import { WhatsAppWebhookEntry } from '@/types/whatsapp';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge || '', { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entries: WhatsAppWebhookEntry[] = body?.entry || [];

    await connectDB();

    for (const entry of entries) {
      for (const change of entry.changes || []) {
        for (const status of change.value?.statuses || []) {
          const mapped =
            status.status === 'read'
              ? 'delivered'
              : status.status === 'failed'
                ? 'failed'
                : status.status;

          const errorMessage = status.errors?.[0]?.title;

          const previousRecipient = await CampaignRecipient.findOne({
            whatsappMessageId: status.id,
          });
          const previousStatus = previousRecipient?.status;

          if (previousStatus === 'delivered' && mapped === 'sent') {
            continue;
          }

          await MessageLog.findOneAndUpdate(
            { whatsappMessageId: status.id },
            {
              status: mapped,
              ...(mapped === 'delivered' ? { deliveredAt: new Date() } : {}),
              ...(mapped === 'failed' ? { errorMessage } : {}),
            }
          );

          const recipient = await CampaignRecipient.findOneAndUpdate(
            { whatsappMessageId: status.id },
            {
              status: mapped,
              ...(mapped === 'delivered' ? { deliveredAt: new Date() } : {}),
              ...(mapped === 'failed' ? { errorMessage } : {}),
            },
            { new: true }
          );

          if (recipient?.campaignId && mapped === 'delivered' && previousStatus !== 'delivered') {
            await Campaign.findByIdAndUpdate(recipient.campaignId, { $inc: { deliveredCount: 1 } });
          }
          if (recipient?.campaignId && mapped === 'failed' && previousStatus !== 'failed') {
            await Campaign.findByIdAndUpdate(recipient.campaignId, { $inc: { failedCount: 1 } });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('WhatsApp webhook error', err);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
