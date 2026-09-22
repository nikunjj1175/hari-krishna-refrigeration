'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, CustomerFormValues } from '@/lib/validation/customer';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Category } from '@/types/customer';

interface Props {
  categories: Category[];
  defaultValues?: Partial<CustomerFormValues>;
  onSubmit: (data: CustomerFormValues) => Promise<void>;
  submitting?: boolean;
}

export default function CustomerForm({ categories, defaultValues, onSubmit, submitting }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      businessName: '',
      phone: '',
      alternatePhone: '',
      whatsappNumber: '',
      email: '',
      categories: [],
      address: { addressLine: '', city: '', state: '', pincode: '' },
      notes: '',
      status: 'active',
      ...defaultValues,
    },
  });

  const selected = watch('categories') || [];

  useEffect(() => {
    if (defaultValues) {
      Object.entries(defaultValues).forEach(([key, value]) => {
        setValue(key as keyof CustomerFormValues, value as never);
      });
    }
  }, [defaultValues, setValue]);

  const toggleCategory = (id: string) => {
    if (selected.includes(id)) {
      setValue(
        'categories',
        selected.filter((c) => c !== id)
      );
    } else {
      setValue('categories', [...selected, id]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="card p-6 space-y-4">
        <h2 className="section-title">Basic information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Customer Name" required {...register('name')} error={errors.name?.message} />
          <Input label="Business Name" {...register('businessName')} error={errors.businessName?.message} />
          <Input label="Phone Number" required {...register('phone')} error={errors.phone?.message} />
          <Input
            label="Alternate Phone"
            {...register('alternatePhone')}
            error={errors.alternatePhone?.message}
          />
          <Input
            label="WhatsApp Number"
            required
            {...register('whatsappNumber')}
            error={errors.whatsappNumber?.message}
          />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            {...register('status')}
          />
        </div>
        <div>
          <p className="label">Categories</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat._id}
                type="button"
                onClick={() => toggleCategory(cat._id)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  selected.includes(cat._id)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="section-title">Address</h2>
        <Textarea label="Address Line" {...register('address.addressLine')} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="City" {...register('address.city')} />
          <Input label="State" {...register('address.state')} />
          <Input label="Pincode" {...register('address.pincode')} error={errors.address?.pincode?.message} />
        </div>
        <Textarea label="Notes" {...register('notes')} />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={submitting}>
          Save Customer
        </Button>
      </div>
    </form>
  );
}
