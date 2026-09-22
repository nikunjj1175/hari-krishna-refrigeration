import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import MessageLog from '@/models/MessageLog';
import Customer from '@/models/Customer';
import {
  errorResponse,
  paginatedResponse,
  validateSession,
  getPaginationParams,
} from '@/lib/utils/api';
import { escapeRegex } from '@/lib/utils/escapeRegex';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const { page, limit, skip } = getPaginationParams(req.url);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const campaignId = searchParams.get('campaignId') || '';
    const customerId = searchParams.get('customerId') || '';
    const category = searchParams.get('category') || '';
    const q = searchParams.get('q')?.trim() || '';
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (campaignId) filter.campaignId = campaignId;
    if (customerId) filter.customerId = customerId;
    if (from || to) {
      filter.createdAt = {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(`${to}T23:59:59.999Z`) } : {}),
      };
    }

    if (category) {
      const ids = await Customer.find({ categories: category }).distinct('_id');
      filter.customerId = { $in: ids };
    }

    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      const customers = await Customer.find({
        $or: [{ name: rx }, { businessName: rx }, { whatsappNumber: rx }],
      }).distinct('_id');
      filter.$or = [{ customerId: { $in: customers } }, { whatsappNumber: rx }, { message: rx }];
    }

    const [logs, total] = await Promise.all([
      MessageLog.find(filter)
        .populate('customerId')
        .populate('campaignId')
        .populate('media')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MessageLog.countDocuments(filter),
    ]);

    const data = logs.map((log) => ({
      ...log,
      customer: log.customerId,
      campaign: log.campaignId,
    }));

    return paginatedResponse(data, total, page, limit);
  } catch (err) {
    console.error('GET /api/messages', err);
    return errorResponse('Failed to fetch messages');
  }
}
