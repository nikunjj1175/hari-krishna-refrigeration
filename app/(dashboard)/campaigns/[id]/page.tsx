'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { apiFetch } from '@/lib/utils/client';
import { formatDateTime } from '@/lib/utils';
import { Campaign, CampaignRecipient } from '@/types/campaign';

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [confirmSend, setConfirmSend] = useState(false);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, r] = await Promise.all([
      apiFetch<Campaign>(`/api/campaigns/${params.id}`),
      apiFetch<CampaignRecipient[]>(`/api/campaigns/${params.id}/recipients?page=${page}&limit=20`),
    ]);
    if (c.data) setCampaign(c.data);
    if (r.data) {
      setRecipients(r.data);
      if (r.pagination) setPagination(r.pagination);
    }
    setLoading(false);
  }, [params.id, page]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    setWorking(true);
    const res = await apiFetch(`/api/campaigns/${params.id}/send`, { method: 'POST' });
    setWorking(false);
    setConfirmSend(false);
    if (res.success) {
      toast.success('Campaign queued');
      load();
    } else toast.error(res.error || 'Send failed');
  };

  const retry = async () => {
    setWorking(true);
    const res = await apiFetch(`/api/campaigns/${params.id}/retry`, { method: 'POST' });
    setWorking(false);
    if (res.success) {
      toast.success('Retry started');
      load();
    } else toast.error(res.error || 'Retry failed');
  };

  if (loading || !campaign) return <PageLoader />;

  return (
    <div className="space-y-5">
      <Link href="/campaigns" className="text-sm text-primary-600">
        ← Campaigns
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{campaign.name}</h1>
          <p className="text-sm text-gray-500">{campaign.description}</p>
        </div>
        <div className="flex gap-2">
          {(campaign.status === 'draft' || campaign.status === 'failed') && (
            <Button onClick={() => setConfirmSend(true)}>Send</Button>
          )}
          {campaign.failedCount > 0 && (
            <Button variant="secondary" loading={working} onClick={retry}>
              Retry failed
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          ['Status', campaign.status],
          ['Recipients', campaign.totalRecipients],
          ['Sent', campaign.sentCount],
          ['Delivered', campaign.deliveredCount],
          ['Failed', campaign.failedCount],
        ].map(([label, value]) => (
          <div key={String(label)} className="card p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-semibold capitalize mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="card p-5 space-y-3">
        <h2 className="section-title">Message</h2>
        <pre className="text-sm whitespace-pre-wrap bg-gray-50 rounded-lg p-4">{campaign.message}</pre>
        {campaign.media && (
          <p className="text-sm text-gray-600">
            Media: {campaign.media.originalName} ({campaign.media.fileType})
          </p>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="section-title">Recipients</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">WhatsApp</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Sent</th>
                <th className="px-4 py-3 text-left">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recipients.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-3">{r.customer?.name || '—'}</td>
                  <td className="px-4 py-3">{r.whatsappNumber}</td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusVariant(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{formatDateTime(r.sentAt)}</td>
                  <td className="px-4 py-3 text-red-600 max-w-xs truncate">{r.errorMessage || '—'}</td>
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
      </div>

      <ConfirmDialog
        isOpen={confirmSend}
        onClose={() => setConfirmSend(false)}
        onConfirm={send}
        title="Send campaign"
        message={`You are about to send this campaign to ${campaign.totalRecipients} customers.`}
        confirmLabel="Send now"
        confirmVariant="primary"
        loading={working}
      />
    </div>
  );
}
