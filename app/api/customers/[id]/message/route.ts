import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Customer from '@/models/Customer';
import Machine from '@/models/Machine';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';
import { sendDirectMessage } from '@/lib/whatsapp/campaignProcessor';
import { renderCustomerMessage } from '@/lib/whatsapp/interpolate';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const schema = z.object({
  message: z.string().min(1).max(4096),
  media: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    const limited = rateLimit('direct-message', 20, 60_000);
    if (!limited.success) return errorResponse('Too many requests', 429);

    await connectDB();
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse('Validation failed', 400, parsed.error.flatten());

    const customer = await Customer.findById(params.id);
    if (!customer) return errorResponse('Customer not found', 404);

    const machines = await Machine.find({ customerId: customer._id }).lean();
    const message = renderCustomerMessage(parsed.data.message, customer, machines);

    const result = await sendDirectMessage({
      customerId: customer._id.toString(),
      whatsappNumber: customer.whatsappNumber,
      message,
      mediaId: parsed.data.media,
    });

    if (!result.success) {
      return errorResponse(result.error || 'Failed to send message', 502);
    }

    return successResponse({ messageId: result.messageId });
  } catch (err) {
    console.error('POST /api/customers/[id]/message', err);
    return errorResponse('Failed to send message');
  }
}
