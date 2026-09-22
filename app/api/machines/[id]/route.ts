import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Machine from '@/models/Machine';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';
import { machineSchema } from '@/lib/validation/customer';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const body = await req.json();
    const parsed = machineSchema.partial().safeParse({
      ...body,
      quantity: body.quantity !== undefined ? Number(body.quantity) : undefined,
    });
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.flatten());
    }

    const machine = await Machine.findByIdAndUpdate(params.id, parsed.data, { new: true });
    if (!machine) return errorResponse('Machine not found', 404);
    return successResponse(machine);
  } catch {
    return errorResponse('Failed to update machine');
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const machine = await Machine.findByIdAndDelete(params.id);
    if (!machine) return errorResponse('Machine not found', 404);
    return successResponse({ message: 'Machine deleted' });
  } catch {
    return errorResponse('Failed to delete machine');
  }
}
