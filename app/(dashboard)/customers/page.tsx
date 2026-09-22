'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Eye, MessageCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { apiFetch } from '@/lib/utils/client';
import { Customer, Category } from '@/types/customer';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (city) params.set('city', city);
    if (status) params.set('status', status);
    const res = await apiFetch<Customer[]>(`/api/customers?${params}`);
    if (res.success && res.data) {
      setCustomers(res.data);
      if (res.pagination) setPagination(res.pagination);
    }
    setLoading(false);
  }, [page, q, category, city, status]);

  useEffect(() => {
    apiFetch<Category[]>('/api/categories').then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const onDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await apiFetch(`/api/customers/${deleteId}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.success) {
      toast.success('Customer deleted');
      setDeleteId(null);
      load();
    } else {
      toast.error(res.error || 'Delete failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-sm text-gray-500">Manage refrigeration customers</p>
        </div>
        <Link href="/customers/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add Customer</Button>
        </Link>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search name, business, phone, WhatsApp..." />
        <Select
          options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c._id, label: c.name }))]}
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
        />
        <input
          className="input-field"
          placeholder="Filter by city"
          value={city}
          onChange={(e) => { setCity(e.target.value); setPage(1); }}
        />
        <Select
          options={[
            { value: '', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description="Add your first customer to start campaigns."
            actionLabel="Add Customer"
            onAction={() => (window.location.href = '/customers/new')}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Business</th>
                    <th className="px-4 py-3 text-left">WhatsApp</th>
                    <th className="px-4 py-3 text-left">Categories</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customers.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{c.customerCode}</td>
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3">{c.businessName || '—'}</td>
                      <td className="px-4 py-3">{c.whatsappNumber}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(c.categories || []).map((cat) => (
                            <Badge key={cat._id}>{cat.name}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusVariant(c.status)}>{c.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link href={`/customers/${c._id}`} className="p-2 hover:bg-gray-100 rounded">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link href={`/customers/${c._id}/edit`} className="p-2 hover:bg-gray-100 rounded">
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <Link href={`/customers/${c._id}?message=1`} className="p-2 hover:bg-gray-100 rounded text-green-600">
                            <MessageCircle className="h-4 w-4" />
                          </Link>
                          <button onClick={() => setDeleteId(c._id)} className="p-2 hover:bg-red-50 rounded text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={setPage}
              total={pagination.total}
              limit={pagination.limit}
            />
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={onDelete}
        title="Delete customer"
        message="This will also remove machines linked to this customer. This cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
