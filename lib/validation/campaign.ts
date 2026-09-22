import { z } from 'zod';

export const campaignSchema = z.object({
  name: z.string().min(2, 'Campaign name must be at least 2 characters').max(200),
  description: z.string().max(500).optional().or(z.literal('')),
  targetType: z.enum(['all', 'category', 'individual']),
  targetCategories: z.array(z.string()).default([]),
  targetCustomers: z.array(z.string()).default([]),
  message: z.string().min(1, 'Message is required').max(4096),
  media: z.string().optional(),
});

export type CampaignFormValues = z.infer<typeof campaignSchema>;

export const templateSchema = z.object({
  name: z.string().min(2, 'Template name must be at least 2 characters').max(200),
  category: z.string().min(1, 'Category is required'),
  message: z.string().min(1, 'Message is required').max(4096),
  media: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;
