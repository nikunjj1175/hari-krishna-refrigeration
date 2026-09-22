'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CustomerForm from '@/components/customers/CustomerForm';
import { apiFetch } from '@/lib/utils/client';
import { Category, Customer } from '@/types/customer';
import { CustomerFormValues } from '@/lib/validation/customer';
import toast from 'react-hot-toast';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<Category[]>('/api/categories'),
      apiFetch<Customer>(`/api/customers/${params.id}`),
    ]).then(([cats, cust]) => {
      if (cats.success && cats.data) setCategories(cats.data);
      if (cust.success && cust.data) setCustomer(cust.data);
    });
  }, [params.id]);

  const onSubmit = async (data: CustomerFormValues) => {
    setSubmitting(true);
    const res = await apiFetch(`/api/customers/${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setSubmitting(false);
    if (res.success) {
      toast.success('Customer updated');
      router.push(`/customers/${params.id}`);
    } else {
      toast.error(res.error || 'Failed to update');
    }
  };

  if (!customer) return <PageLoader />;

  return (
    <div className="max-w-4xl space-y-4">
      <Link href={`/customers/${params.id}`} className="text-sm text-primary-600">
        ← Back
      </Link>
      <h1 className="page-title">Edit Customer</h1>
      <CustomerForm
        categories={categories}
        defaultValues={{
          name: customer.name,
          businessName: customer.businessName || '',
          phone: customer.phone,
          alternatePhone: customer.alternatePhone || '',
          whatsappNumber: customer.whatsappNumber,
          email: customer.email || '',
          categories: (customer.categories || []).map((c) => c._id),
          address: customer.address || { addressLine: '', city: '', state: '', pincode: '' },
          notes: customer.notes || '',
          status: customer.status,
        }}
        onSubmit={onSubmit}
        submitting={submitting}
      />
    </div>
  );
}
