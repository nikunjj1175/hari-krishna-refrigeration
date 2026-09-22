import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Setting from '@/models/Setting';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';
import { z } from 'zod';

const updateSchema = z.object({
  businessName: z.string().max(150).optional(),
  defaultState: z.string().max(100).optional(),
  rateDelayMs: z.number().int().min(100).max(5000).optional(),
});

export async function GET() {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const settings = await Setting.find().lean();
    const map: Record<string, unknown> = {};
    for (const s of settings) map[s.key] = s.value;

    return successResponse({
      values: {
        businessName: map.businessName || 'Hari Krishna Refrigeration',
        defaultState: map.defaultState || 'Tamil Nadu',
        rateDelayMs: map.rateDelayMs || Number(process.env.WHATSAPP_RATE_DELAY_MS || 250),
      },
      whatsappConfigured: Boolean(
        process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
      ),
      storageProvider: process.env.STORAGE_PROVIDER || 'cloudinary',
      cloudinaryConfigured: Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
      ),
    });
  } catch {
    return errorResponse('Failed to fetch settings');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return errorResponse('Validation failed', 400, parsed.error.flatten());

    const entries: Array<{ key: string; value: unknown; group: string; label: string }> = [
      {
        key: 'businessName',
        value: parsed.data.businessName,
        group: 'general',
        label: 'Business Name',
      },
      {
        key: 'defaultState',
        value: parsed.data.defaultState,
        group: 'general',
        label: 'Default State',
      },
      {
        key: 'rateDelayMs',
        value: parsed.data.rateDelayMs,
        group: 'whatsapp',
        label: 'WhatsApp Rate Delay (ms)',
      },
    ];

    for (const entry of entries) {
      if (entry.value === undefined) continue;
      await Setting.findOneAndUpdate(
        { key: entry.key },
        { $set: entry },
        { upsert: true, new: true }
      );
    }

    return successResponse({ message: 'Settings saved' });
  } catch {
    return errorResponse('Failed to save settings');
  }
}
