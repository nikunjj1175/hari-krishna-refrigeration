import Customer, { ICustomer } from '@/models/Customer';
import { Types } from 'mongoose';

export async function resolveAudience(params: {
  targetType: 'all' | 'category' | 'individual';
  targetCategories?: string[];
  targetCustomers?: string[];
}): Promise<ICustomer[]> {
  const filter: Record<string, unknown> = { status: 'active' };

  if (params.targetType === 'category') {
    const ids = (params.targetCategories || []).filter(Boolean);
    if (!ids.length) return [];
    filter.categories = { $in: ids.map((id) => new Types.ObjectId(id)) };
  }

  if (params.targetType === 'individual') {
    const ids = (params.targetCustomers || []).filter(Boolean);
    if (!ids.length) return [];
    filter._id = { $in: ids.map((id) => new Types.ObjectId(id)) };
  }

  return Customer.find(filter).populate('categories').lean<ICustomer[]>();
}
