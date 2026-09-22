'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerForm from '@/components/customers/CustomerForm';
import { apiFetch } from '@/lib/utils/client';
import { Category } from '@/types/customer';
import { CustomerFormValues } from '@/lib/validation/customer';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NewCustomerPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Category[]>('/api/categories').then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  const onSubmit = async (data: CustomerFormValues) => {
    setSubmitting(true);
    const res = await apiFetch('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setSubmitting(false);
    if (res.success) {
      toast.success('Customer created');
      router.push('/customers');
    } else {
      toast.error(res.error || 'Failed to create customer');
    }
  };

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <Link href="/customers" className="text-sm text-primary-600">
          ← Back to customers
        </Link>
        <h1 className="page-title mt-2">Add Customer</h1>
      </div>
      <CustomerForm categories={categories} onSubmit={onSubmit} submitting={submitting} />
    </div>
  );
}
