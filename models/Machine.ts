import mongoose, { Schema, Types } from 'mongoose';

export interface IMachine {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  type: string;
  brand?: string;
  model?: string;
  capacity?: string;
  quantity: number;
  installationDate?: Date;
  lastServiceDate?: Date;
  nextServiceDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MachineSchema = new Schema<IMachine>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    type: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    model: { type: String, trim: true },
    capacity: { type: String, trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    installationDate: { type: Date },
    lastServiceDate: { type: Date },
    nextServiceDate: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

MachineSchema.index({ customerId: 1 });
MachineSchema.index({ nextServiceDate: 1 });

export default mongoose.models.Machine || mongoose.model<IMachine>('Machine', MachineSchema);
