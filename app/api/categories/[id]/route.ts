import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Category from '@/models/Category';
import Customer from '@/models/Customer';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(300).optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const category = await Category.findById(params.id).lean();
    if (!category) return errorResponse('Category not found', 404);

    const customerCount = await Customer.countDocuments({
      categories: params.id,
      status: 'active',
    });

    return successResponse({ ...category, customerCount });
  } catch (err) {
    return errorResponse('Failed to fetch category');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.flatten());
    }

    if (parsed.data.name) {
      const existing = await Category.findOne({
        name: parsed.data.name,
        _id: { $ne: params.id },
      });
      if (existing) return errorResponse('Category name already exists', 409);
    }

    const category = await Category.findByIdAndUpdate(params.id, parsed.data, {
      new: true,
    });
    if (!category) return errorResponse('Category not found', 404);

    return successResponse(category);
  } catch (err) {
    return errorResponse('Failed to update category');
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();

    const category = await Category.findById(params.id);
    if (!category) return errorResponse('Category not found', 404);

    // Remove category from all customers
    await Customer.updateMany(
      { categories: params.id },
      { $pull: { categories: params.id } }
    );

    await Category.findByIdAndDelete(params.id);
    return successResponse({ message: 'Category deleted successfully' });
  } catch (err) {
    return errorResponse('Failed to delete category');
  }
}
