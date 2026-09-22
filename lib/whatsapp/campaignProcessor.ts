import connectDB from '@/lib/db/mongoose';
import Campaign from '@/models/Campaign';
import CampaignRecipient from '@/models/CampaignRecipient';
import MessageLog from '@/models/MessageLog';
import Media from '@/models/Media';
import { getWhatsAppService } from '@/lib/whatsapp';
import { WhatsAppSendResult } from '@/types/whatsapp';

const DELAY_MS = Number(process.env.WHATSAPP_RATE_DELAY_MS || 250);
const MAX_RETRIES = Number(process.env.WHATSAPP_MAX_RETRIES || 3);

const running = new Set<string>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWithMedia(
  to: string,
  message: string,
  mediaId?: string
): Promise<WhatsAppSendResult> {
  const wa = getWhatsAppService();

  if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return {
      success: false,
      error: 'WhatsApp Cloud API is not configured. Set WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID.',
    };
  }

  if (!mediaId) {
    return wa.sendText({ to, message });
  }

  const media = await Media.findById(mediaId);
  if (!media) {
    return wa.sendText({ to, message });
  }

  const payload = {
    to,
    mediaUrl: media.url,
    mimeType: media.mimeType,
    fileName: media.originalName,
    caption: message,
    message,
  };

  if (media.fileType === 'image') return wa.sendImage(payload);
  if (media.fileType === 'video') return wa.sendVideo(payload);
  return wa.sendDocument(payload);
}

async function sendOneRecipient(campaignId: string, recipientId: string) {
  const campaign = await Campaign.findById(campaignId);
  const recipient = await CampaignRecipient.findById(recipientId);
  if (!campaign || !recipient) return;

  const result = await sendWithMedia(
    recipient.whatsappNumber,
    recipient.message,
    campaign.media?.toString()
  );

  if (result.success) {
    recipient.status = 'sent';
    recipient.whatsappMessageId = result.messageId;
    recipient.sentAt = new Date();
    recipient.errorMessage = undefined;
    await recipient.save();

    await Campaign.findByIdAndUpdate(campaignId, { $inc: { sentCount: 1 } });

    await MessageLog.create({
      customerId: recipient.customerId,
      campaignId: campaign._id,
      whatsappNumber: recipient.whatsappNumber,
      message: recipient.message,
      media: campaign.media,
      status: 'sent',
      whatsappMessageId: result.messageId,
      sentAt: new Date(),
    });
  } else {
    recipient.retryCount = (recipient.retryCount || 0) + 1;
    if (recipient.retryCount >= MAX_RETRIES) {
      recipient.status = 'failed';
      recipient.errorMessage = result.error;
      await recipient.save();
      await Campaign.findByIdAndUpdate(campaignId, { $inc: { failedCount: 1 } });
      await MessageLog.create({
        customerId: recipient.customerId,
        campaignId: campaign._id,
        whatsappNumber: recipient.whatsappNumber,
        message: recipient.message,
        media: campaign.media,
        status: 'failed',
        errorMessage: result.error,
      });
    } else {
      recipient.status = 'pending';
      recipient.errorMessage = result.error;
      await recipient.save();
    }
  }
}

export async function processCampaign(campaignId: string) {
  if (running.has(campaignId)) return;
  running.add(campaignId);

  try {
    await connectDB();
    await Campaign.findByIdAndUpdate(campaignId, {
      status: 'sending',
      startedAt: new Date(),
    });

    while (true) {
      const recipient = await CampaignRecipient.findOneAndUpdate(
        { campaignId, status: 'pending' },
        { $set: { errorMessage: undefined } },
        { sort: { createdAt: 1 }, new: true }
      );

      if (!recipient) break;

      await sendOneRecipient(campaignId, recipient._id.toString());
      await sleep(DELAY_MS);
    }

    const failed = await CampaignRecipient.countDocuments({ campaignId, status: 'failed' });
    const delivered = await CampaignRecipient.countDocuments({ campaignId, status: 'delivered' });
    const sent = await CampaignRecipient.countDocuments({
      campaignId,
      status: { $in: ['sent', 'delivered'] },
    });

    await Campaign.findByIdAndUpdate(campaignId, {
      status: sent === 0 && failed > 0 ? 'failed' : 'completed',
      completedAt: new Date(),
      sentCount: sent,
      deliveredCount: delivered,
      failedCount: failed,
    });
  } catch (err) {
    console.error('processCampaign error:', err);
    await Campaign.findByIdAndUpdate(campaignId, { status: 'failed' });
  } finally {
    running.delete(campaignId);
  }
}

export async function retryFailedRecipients(campaignId: string) {
  await connectDB();
  await CampaignRecipient.updateMany(
    { campaignId, status: 'failed' },
    { $set: { status: 'pending', errorMessage: undefined, retryCount: 0 } }
  );
  await Campaign.findByIdAndUpdate(campaignId, { status: 'sending' });
  void processCampaign(campaignId);
}

export async function sendDirectMessage(params: {
  customerId: string;
  whatsappNumber: string;
  message: string;
  mediaId?: string;
}) {
  if (!process.env.WHATSAPP_API_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return {
      success: false as const,
      error: 'WhatsApp Cloud API is not configured.',
    };
  }

  const result = await sendWithMedia(params.whatsappNumber, params.message, params.mediaId);

  await MessageLog.create({
    customerId: params.customerId,
    whatsappNumber: params.whatsappNumber,
    message: params.message,
    media: params.mediaId,
    status: result.success ? 'sent' : 'failed',
    whatsappMessageId: result.messageId,
    errorMessage: result.error,
    sentAt: result.success ? new Date() : undefined,
  });

  return result;
}
