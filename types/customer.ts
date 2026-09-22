export interface CustomerAddress {
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface Customer {
  _id: string;
  customerCode: string;
  name: string;
  businessName?: string;
  phone: string;
  alternatePhone?: string;
  whatsappNumber: string;
  email?: string;
  categories: Category[];
  address: CustomerAddress;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  customerCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Machine {
  _id: string;
  customerId: string;
  type: string;
  brand?: string;
  model?: string;
  capacity?: string;
  quantity: number;
  installationDate?: string;
  lastServiceDate?: string;
  nextServiceDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormData {
  name: string;
  businessName?: string;
  phone: string;
  alternatePhone?: string;
  whatsappNumber: string;
  email?: string;
  categories: string[];
  address: CustomerAddress;
  notes?: string;
  status: 'active' | 'inactive';
}

export interface MachineFormData {
  customerId: string;
  type: string;
  brand?: string;
  model?: string;
  capacity?: string;
  quantity: number;
  installationDate?: string;
  lastServiceDate?: string;
  nextServiceDate?: string;
  notes?: string;
}
