import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICustomer extends Document {
  customerCode: string;
  name: string;
  businessName?: string;
  phone: string;
  alternatePhone?: string;
  whatsappNumber: string;
  email?: string;
  categories: Types.ObjectId[];
  address: {
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customerCode: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    businessName: { type: String, trim: true },
    phone: { type: String, required: true, trim: true, unique: true },
    alternatePhone: { type: String, trim: true },
    whatsappNumber: { type: String, required: true, trim: true, unique: true },
    email: { type: String, lowercase: true, trim: true },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    address: {
      addressLine: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    notes: { type: String, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

CustomerSchema.index({ name: 'text', businessName: 'text', phone: 'text', whatsappNumber: 'text' });
CustomerSchema.index({ categories: 1 });
CustomerSchema.index({ status: 1 });
CustomerSchema.index({ 'address.city': 1 });

// Auto-generate customer code before saving
CustomerSchema.pre('save', async function (next) {
  if (!this.customerCode) {
    const count = await mongoose.model('Customer').countDocuments();
    this.customerCode = `HKR${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
