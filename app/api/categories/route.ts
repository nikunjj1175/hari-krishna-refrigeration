import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Category from '@/models/Category';
import Customer from '@/models/Customer';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(300).optional(),
  color: z.string().default('#3b82f6'),
});

export async function GET(req: NextRequest) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();

    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();

    // Get customer count per category
    const counts = await Customer.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
    ]);

    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

    const result = categories.map((cat) => ({
      ...cat,
      customerCount: countMap.get((cat._id as { toString(): string }).toString()) || 0,
    }));

    return successResponse(result);
  } catch (err) {
    console.error('GET /api/categories error:', err);
    return errorResponse('Failed to fetch categories');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();

    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.flatten());
    }

    const existing = await Category.findOne({ name: parsed.data.name });
    if (existing) {
      return errorResponse('Category with this name already exists', 409);
    }

    const category = await Category.create(parsed.data);
    return successResponse(category, 201);
  } catch (err) {
    console.error('POST /api/categories error:', err);
    return errorResponse('Failed to create category');
  }
}
