import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Customer from '@/models/Customer';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  validateSession,
  getPaginationParams,
} from '@/lib/utils/api';
import { customerSchema } from '@/lib/validation/customer';
import { escapeRegex } from '@/lib/utils/escapeRegex';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();

    const { page, limit, skip } = getPaginationParams(req.url);
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category') || '';
    const city = searchParams.get('city')?.trim() || '';
    const status = searchParams.get('status') || '';

    const filter: Record<string, unknown> = {};

    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [
        { name: rx },
        { businessName: rx },
        { phone: rx },
        { whatsappNumber: rx },
        { customerCode: rx },
      ];
    }
    if (category) filter.categories = category;
    if (city) filter['address.city'] = new RegExp(escapeRegex(city), 'i');
    if (status) filter.status = status;

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .populate('categories')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(filter),
    ]);

    return paginatedResponse(customers, total, page, limit);
  } catch (err) {
    console.error('GET /api/customers', err);
    return errorResponse('Failed to fetch customers');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    const limited = rateLimit('create-customer', 30, 60_000);
    if (!limited.success) return errorResponse('Too many requests', 429);

    await connectDB();
    const body = await req.json();
    const parsed = customerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.flatten());
    }

    const data = parsed.data;
    const duplicate = await Customer.findOne({
      $or: [{ phone: data.phone }, { whatsappNumber: data.whatsappNumber }],
    });
    if (duplicate) {
      if (duplicate.whatsappNumber === data.whatsappNumber) {
        return errorResponse('WhatsApp number already exists', 409);
      }
      return errorResponse('Phone number already exists', 409);
    }

    const customer = await Customer.create(data);
    const populated = await Customer.findById(customer._id).populate('categories').lean();
    return successResponse(populated, 201);
  } catch (err) {
    console.error('POST /api/customers', err);
    return errorResponse('Failed to create customer');
  }
}
