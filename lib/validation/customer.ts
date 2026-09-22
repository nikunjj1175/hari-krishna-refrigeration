import { z } from 'zod';

const phoneRegex = /^[6-9]\d{9}$/;

export const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  businessName: z.string().max(150).optional().or(z.literal('')),
  phone: z.string().regex(phoneRegex, 'Enter valid 10-digit mobile number'),
  alternatePhone: z
    .string()
    .regex(phoneRegex, 'Enter valid 10-digit mobile number')
    .optional()
    .or(z.literal('')),
  whatsappNumber: z.string().regex(phoneRegex, 'Enter valid 10-digit WhatsApp number'),
  email: z.string().email('Enter valid email').optional().or(z.literal('')),
  categories: z.array(z.string()).default([]),
  address: z.object({
    addressLine: z.string().max(300).optional().or(z.literal('')),
    city: z.string().max(100).optional().or(z.literal('')),
    state: z.string().max(100).optional().or(z.literal('')),
    pincode: z
      .string()
      .regex(/^\d{6}$/, 'Pincode must be 6 digits')
      .optional()
      .or(z.literal('')),
  }),
  notes: z.string().max(1000).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const machineSchema = z.object({
  customerId: z.string().min(1, 'Customer ID required'),
  type: z.string().min(1, 'Machine type is required').max(100),
  brand: z.string().max(100).optional().or(z.literal('')),
  model: z.string().max(100).optional().or(z.literal('')),
  capacity: z.string().max(50).optional().or(z.literal('')),
  quantity: z.number().int().min(1).default(1),
  installationDate: z.string().optional().or(z.literal('')),
  lastServiceDate: z.string().optional().or(z.literal('')),
  nextServiceDate: z.string().optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type MachineFormValues = z.infer<typeof machineSchema>;
