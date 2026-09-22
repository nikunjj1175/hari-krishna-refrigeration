import mongoose, { Document, Schema } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  value: string | number | boolean | object;
  group: string;
  label: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed },
    group: { type: String, required: true, default: 'general' },
    label: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

SettingSchema.index({ group: 1 });

export default mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);
