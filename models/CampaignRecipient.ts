import mongoose, { Document, Schema, Types } from 'mongoose';

export type RecipientStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface ICampaignRecipient extends Document {
  campaignId: Types.ObjectId;
  customerId: Types.ObjectId;
  whatsappNumber: string;
  message: string;
  status: RecipientStatus;
  whatsappMessageId?: string;
  errorMessage?: string;
  retryCount: number;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

const CampaignRecipientSchema = new Schema<ICampaignRecipient>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    whatsappNumber: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['pending', 'sent', 'delivered', 'failed'], default: 'pending' },
    whatsappMessageId: { type: String },
    errorMessage: { type: String },
    retryCount: { type: Number, default: 0 },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CampaignRecipientSchema.index({ campaignId: 1 });
CampaignRecipientSchema.index({ customerId: 1 });
CampaignRecipientSchema.index({ status: 1 });
CampaignRecipientSchema.index({ whatsappMessageId: 1 }, { sparse: true });

export default mongoose.models.CampaignRecipient ||
  mongoose.model<ICampaignRecipient>('CampaignRecipient', CampaignRecipientSchema);
