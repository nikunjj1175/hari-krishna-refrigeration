import { Customer, Category } from './customer';
import { Media } from './media';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
export type CampaignTargetType = 'all' | 'category' | 'individual';
export type RecipientStatus = 'pending' | 'sent' | 'delivered' | 'failed';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface Campaign {
  _id: string;
  name: string;
  description?: string;
  targetType: CampaignTargetType;
  targetCategories: Category[];
  targetCustomers: Customer[];
  message: string;
  media?: Media;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  status: CampaignStatus;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRecipient {
  _id: string;
  campaignId: string;
  customer: Customer;
  whatsappNumber: string;
  message: string;
  status: RecipientStatus;
  whatsappMessageId?: string;
  errorMessage?: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface MessageLog {
  _id: string;
  customer: Customer;
  campaign?: Campaign;
  whatsappNumber: string;
  message: string;
  media?: Media;
  status: MessageStatus;
  whatsappMessageId?: string;
  errorMessage?: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface MessageTemplate {
  _id: string;
  name: string;
  category: string;
  message: string;
  media?: Media;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CampaignFormData {
  name: string;
  description?: string;
  targetType: CampaignTargetType;
  targetCategories: string[];
  targetCustomers: string[];
  message: string;
  media?: string;
}
