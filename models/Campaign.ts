import mongoose, { Document, Schema, Types } from 'mongoose';

export type CampaignTargetType = 'all' | 'category' | 'individual';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';

export interface ICampaign extends Document {
  name: string;
  description?: string;
  targetType: CampaignTargetType;
  targetCategories: Types.ObjectId[];
  targetCustomers: Types.ObjectId[];
  message: string;
  media?: Types.ObjectId;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  status: CampaignStatus;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    targetType: { type: String, enum: ['all', 'category', 'individual'], required: true },
    targetCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    targetCustomers: [{ type: Schema.Types.ObjectId, ref: 'Customer' }],
    message: { type: String, required: true },
    media: { type: Schema.Types.ObjectId, ref: 'Media' },
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'completed', 'failed'],
      default: 'draft',
    },
    scheduledAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

CampaignSchema.index({ status: 1 });
CampaignSchema.index({ createdAt: -1 });

export default mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
