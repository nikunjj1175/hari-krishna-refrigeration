import mongoose, { Document, Schema, Types } from 'mongoose';

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface IMessageLog extends Document {
  customerId: Types.ObjectId;
  campaignId?: Types.ObjectId;
  whatsappNumber: string;
  message: string;
  media?: Types.ObjectId;
  status: MessageStatus;
  whatsappMessageId?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

const MessageLogSchema = new Schema<IMessageLog>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    whatsappNumber: { type: String, required: true },
    message: { type: String, required: true },
    media: { type: Schema.Types.ObjectId, ref: 'Media' },
    status: { type: String, enum: ['pending', 'sent', 'delivered', 'failed'], default: 'pending' },
    whatsappMessageId: { type: String },
    errorMessage: { type: String },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MessageLogSchema.index({ customerId: 1 });
MessageLogSchema.index({ campaignId: 1 });
MessageLogSchema.index({ status: 1 });
MessageLogSchema.index({ createdAt: -1 });
MessageLogSchema.index({ whatsappMessageId: 1 }, { sparse: true });

export default mongoose.models.MessageLog ||
  mongoose.model<IMessageLog>('MessageLog', MessageLogSchema);
