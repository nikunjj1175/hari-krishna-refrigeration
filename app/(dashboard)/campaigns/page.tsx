'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, Trash2, Megaphone } from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { apiFetch } from '@/lib/utils/client';
import { formatDate } from '@/lib/utils';
import { Campaign } from '@/types/campaign';
import { Category } from '@/types/customer';
import toast from 'react-hot-toast';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    if (from) params.set('from', from);
    const res = await apiFetch<Campaign[]>(`/api/campaigns?${params}`);
    if (res.success && res.data) {
      setCampaigns(res.data);
      if (res.pagination) setPagination(res.pagination);
    }
    setLoading(false);
  }, [page, status, category, from]);

  useEffect(() => {
    apiFetch<Category[]>('/api/categories').then((r) => r.data && setCategories(r.data));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async () => {
    if (!deleteId) return;
    const res = await apiFetch(`/api/campaigns/${deleteId}`, { method: 'DELETE' });
    if (res.success) {
      toast.success('Campaign deleted');
      setDeleteId(null);
      load();
    } else toast.error(res.error || 'Cannot delete');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="text-sm text-gray-500">WhatsApp campaign history and sending</p>
        </div>
        <Link href="/campaigns/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>New Campaign</Button>
        </Link>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <Select
          options={[
            { value: '', label: 'All statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'sending', label: 'Sending' },
            { value: 'completed', label: 'Completed' },
            { value: 'failed', label: 'Failed' },
            { value: 'scheduled', label: 'Scheduled' },
          ]}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        />
        <Select
          options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c._id, label: c.name }))]}
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
        />
        <input type="date" className="input-field" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : campaigns.length === 0 ? (
          <EmptyState icon={Megaphone} title="No campaigns" actionLabel="Create campaign" onAction={() => (window.location.href = '/campaigns/new')} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left">Campaign</th>
                    <th className="px-4 py-3 text-left">Target</th>
                    <th className="px-4 py-3 text-left">Recipients</th>
                    <th className="px-4 py-3 text-left">Sent</th>
                    <th className="px-4 py-3 text-left">Delivered</th>
                    <th className="px-4 py-3 text-left">Failed</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {campaigns.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 capitalize">{c.targetType}</td>
                      <td className="px-4 py-3">{c.totalRecipients}</td>
                      <td className="px-4 py-3">{c.sentCount}</td>
                      <td className="px-4 py-3">{c.deliveredCount}</td>
                      <td className="px-4 py-3">{c.failedCount}</td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusVariant(c.status)}>{c.status}</Badge>
                      </td>
                      <td className="px-4 py-3">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/campaigns/${c._id}`} className="p-2 inline-block hover:bg-gray-100 rounded">
                          <Eye className="h-4 w-4" />
                        </Link>
                        {c.status !== 'sending' && (
                          <button className="p-2 hover:bg-red-50 rounded text-red-600" onClick={() => setDeleteId(c._id)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        title="Delete campaign"
        message="Recipient records for this campaign will also be removed."
      />
    </div>
  );
}
