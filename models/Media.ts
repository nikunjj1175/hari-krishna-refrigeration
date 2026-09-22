import mongoose, { Document, Schema } from 'mongoose';

export interface IMedia extends Document {
  fileName: string;
  originalName: string;
  fileType: 'image' | 'video' | 'document';
  mimeType: string;
  fileSize: number;
  url: string;
  storageProvider: 'local' | 'cloudinary' | 's3';
  storageKey?: string;
  publicId?: string;
  uploadedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { type: String, enum: ['image', 'video', 'document'], required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    url: { type: String, required: true },
    storageProvider: { type: String, enum: ['local', 'cloudinary', 's3'], default: 'cloudinary' },
    storageKey: { type: String },
    publicId: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

MediaSchema.index({ fileType: 1 });
MediaSchema.index({ createdAt: -1 });

export default mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);
