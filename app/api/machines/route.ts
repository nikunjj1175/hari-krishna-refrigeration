import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Machine from '@/models/Machine';
import Customer from '@/models/Customer';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';
import { machineSchema } from '@/lib/validation/customer';

export async function GET(req: NextRequest) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const customerId = new URL(req.url).searchParams.get('customerId');
    if (!customerId) return errorResponse('customerId is required', 400);

    const machines = await Machine.find({ customerId }).sort({ createdAt: -1 }).lean();
    return successResponse(machines);
  } catch {
    return errorResponse('Failed to fetch machines');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const body = await req.json();
    const parsed = machineSchema.safeParse({
      ...body,
      quantity: body.quantity ? Number(body.quantity) : 1,
    });
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.flatten());
    }

    const customer = await Customer.findById(parsed.data.customerId);
    if (!customer) return errorResponse('Customer not found', 404);

    const machine = await Machine.create({
      ...parsed.data,
      installationDate: parsed.data.installationDate || undefined,
      lastServiceDate: parsed.data.lastServiceDate || undefined,
      nextServiceDate: parsed.data.nextServiceDate || undefined,
    });
    return successResponse(machine, 201);
  } catch {
    return errorResponse('Failed to create machine');
  }
}
