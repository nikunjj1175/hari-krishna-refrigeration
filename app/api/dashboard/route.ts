import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Customer from '@/models/Customer';
import Category from '@/models/Category';
import Campaign from '@/models/Campaign';
import MessageLog from '@/models/MessageLog';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();

    const categories = await Category.find({ isDefault: true }).lean();
    const categoryCounts = await Promise.all(
      categories.map(async (cat) => ({
        name: cat.name,
        _id: cat._id,
        color: cat.color,
        count: await Customer.countDocuments({ categories: cat._id, status: 'active' }),
      }))
    );

    const [
      totalCustomers,
      totalCampaigns,
      sentMessages,
      deliveredMessages,
      failedMessages,
      recentCustomers,
      recentCampaigns,
      campaignByStatus,
    ] = await Promise.all([
      Customer.countDocuments(),
      Campaign.countDocuments(),
      MessageLog.countDocuments({ status: { $in: ['sent', 'delivered'] } }),
      MessageLog.countDocuments({ status: 'delivered' }),
      MessageLog.countDocuments({ status: 'failed' }),
      Customer.find().populate('categories').sort({ createdAt: -1 }).limit(5).lean(),
      Campaign.find().sort({ createdAt: -1 }).limit(5).lean(),
      Campaign.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const pendingMessages = await MessageLog.countDocuments({ status: 'pending' });

    return successResponse({
      totals: {
        customers: totalCustomers,
        campaigns: totalCampaigns,
        messagesSent: sentMessages,
        delivered: deliveredMessages,
        failed: failedMessages,
        pending: pendingMessages,
      },
      categoryCounts,
      recentCustomers,
      recentCampaigns,
      campaignByStatus,
      deliveryStats: [
        { name: 'Delivered', value: deliveredMessages },
        { name: 'Sent', value: Math.max(0, sentMessages - deliveredMessages) },
        { name: 'Failed', value: failedMessages },
        { name: 'Pending', value: pendingMessages },
      ],
    });
  } catch (err) {
    console.error('GET /api/dashboard', err);
    return errorResponse('Failed to load dashboard');
  }
}
