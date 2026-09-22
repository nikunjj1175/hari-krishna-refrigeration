import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Customer from '@/models/Customer';
import Machine from '@/models/Machine';
import CampaignRecipient from '@/models/CampaignRecipient';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';
import { customerSchema } from '@/lib/validation/customer';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const customer = await Customer.findById(params.id).populate('categories').lean();
    if (!customer) return errorResponse('Customer not found', 404);
    return successResponse(customer);
  } catch {
    return errorResponse('Failed to fetch customer');
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const body = await req.json();
    const parsed = customerSchema.partial().safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400, parsed.error.flatten());
    }

    const data = parsed.data;
    if (data.phone || data.whatsappNumber) {
      const or = [];
      if (data.phone) or.push({ phone: data.phone });
      if (data.whatsappNumber) or.push({ whatsappNumber: data.whatsappNumber });
      const duplicate = await Customer.findOne({ $or: or, _id: { $ne: params.id } });
      if (duplicate) {
        if (data.whatsappNumber && duplicate.whatsappNumber === data.whatsappNumber) {
          return errorResponse('WhatsApp number already exists', 409);
        }
        return errorResponse('Phone number already exists', 409);
      }
    }

    const customer = await Customer.findByIdAndUpdate(params.id, data, { new: true }).populate(
      'categories'
    );
    if (!customer) return errorResponse('Customer not found', 404);
    return successResponse(customer);
  } catch {
    return errorResponse('Failed to update customer');
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const customer = await Customer.findById(params.id);
    if (!customer) return errorResponse('Customer not found', 404);

    await Machine.deleteMany({ customerId: params.id });
    await CampaignRecipient.deleteMany({ customerId: params.id });
    await Customer.findByIdAndDelete(params.id);
    return successResponse({ message: 'Customer deleted' });
  } catch {
    return errorResponse('Failed to delete customer');
  }
}
