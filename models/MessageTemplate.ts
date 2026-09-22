import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessageTemplate extends Document {
  name: string;
  category: string;
  message: string;
  media?: Types.ObjectId;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const MessageTemplateSchema = new Schema<IMessageTemplate>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    media: { type: Schema.Types.ObjectId, ref: 'Media' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

MessageTemplateSchema.index({ name: 1 });
MessageTemplateSchema.index({ status: 1 });

export default mongoose.models.MessageTemplate ||
  mongoose.model<IMessageTemplate>('MessageTemplate', MessageTemplateSchema);
