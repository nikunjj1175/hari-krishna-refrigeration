'use client';

import { useCallback, useEffect, useState } from 'react';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { apiFetch } from '@/lib/utils/client';
import { formatDateTime, truncate } from '@/lib/utils';
import { MessageLog, Campaign } from '@/types/campaign';
import { Category } from '@/types/customer';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status) params.set('status', status);
    if (campaignId) params.set('campaignId', campaignId);
    if (category) params.set('category', category);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (q) params.set('q', q);
    const res = await apiFetch<MessageLog[]>(`/api/messages?${params}`);
    if (res.data) {
      setLogs(res.data);
      if (res.pagination) setPagination(res.pagination);
    }
    setLoading(false);
  }, [page, status, campaignId, category, from, to, q]);

  useEffect(() => {
    apiFetch<Campaign[]>('/api/campaigns?limit=100').then((r) => r.data && setCampaigns(r.data));
    apiFetch<Category[]>('/api/categories').then((r) => r.data && setCategories(r.data));
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Message Logs</h1>
        <p className="text-sm text-gray-500">Complete WhatsApp delivery history</p>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Customer or number" />
        <Select
          options={[
            { value: '', label: 'All statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'sent', label: 'Sent' },
            { value: 'delivered', label: 'Delivered' },
            { value: 'failed', label: 'Failed' },
          ]}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        />
        <Select
          options={[{ value: '', label: 'All campaigns' }, ...campaigns.map((c) => ({ value: c._id, label: c.name }))]}
          value={campaignId}
          onChange={(e) => { setCampaignId(e.target.value); setPage(1); }}
        />
        <Select
          options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c._id, label: c.name }))]}
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
        />
        <input type="date" className="input-field" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="input-field" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : logs.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No messages yet" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Campaign</th>
                    <th className="px-4 py-3 text-left">WhatsApp</th>
                    <th className="px-4 py-3 text-left">Message</th>
                    <th className="px-4 py-3 text-left">Media</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">WA ID</th>
                    <th className="px-4 py-3 text-left">Sent</th>
                    <th className="px-4 py-3 text-left">Delivered</th>
                    <th className="px-4 py-3 text-left">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td className="px-4 py-3">{log.customer?.name || '—'}</td>
                      <td className="px-4 py-3">{log.campaign?.name || 'Direct'}</td>
                      <td className="px-4 py-3">{log.whatsappNumber}</td>
                      <td className="px-4 py-3 max-w-xs">{truncate(log.message, 60)}</td>
                      <td className="px-4 py-3">{log.media?.originalName || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusVariant(log.status)}>{log.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs">{log.whatsappMessageId || '—'}</td>
                      <td className="px-4 py-3">{formatDateTime(log.sentAt || log.createdAt)}</td>
                      <td className="px-4 py-3">{formatDateTime(log.deliveredAt)}</td>
                      <td className="px-4 py-3 text-red-600 max-w-xs truncate">{log.errorMessage || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
          </>
        )}
      </div>
    </div>
  );
}
