'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import SearchInput from '@/components/ui/SearchInput';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { apiFetch } from '@/lib/utils/client';
import { Category, Customer } from '@/types/customer';
import { Media } from '@/types/media';
import { MessageTemplate } from '@/types/campaign';
import { TEMPLATE_VARIABLES } from '@/lib/constants';

const STEPS = ['Information', 'Audience', 'Message', 'Media', 'Preview', 'Send'];

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'category' | 'individual'>('all');
  const [targetCategories, setTargetCategories] = useState<string[]>([]);
  const [targetCustomers, setTargetCustomers] = useState<string[]>([]);
  const [message, setMessage] = useState(
    'Dear {{customerName}},\n\nYour {{machineType}} service is due.\nPlease contact Hari Krishna Refrigeration.'
  );
  const [media, setMedia] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [count, setCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<Category[]>('/api/categories'),
      apiFetch<Customer[]>('/api/customers?limit=100&status=active'),
      apiFetch<MessageTemplate[]>('/api/templates'),
      apiFetch<Media[]>('/api/media?limit=50'),
    ]).then(([cats, cust, tmpl, med]) => {
      if (cats.data) setCategories(cats.data);
      if (cust.data) setCustomers(cust.data);
      if (tmpl.data) setTemplates(tmpl.data);
      if (med.data) setMediaItems(med.data);
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams({ limit: '100', status: 'active' });
      if (customerQuery) params.set('q', customerQuery);
      apiFetch<Customer[]>(`/api/customers?${params}`).then((res) => {
        if (res.data) setCustomers(res.data);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [customerQuery]);

  useEffect(() => {
    apiFetch<{ count: number }>('/api/campaigns/preview-audience', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetCategories, targetCustomers }),
    }).then((res) => {
      if (res.success && res.data) setCount(res.data.count);
    });
  }, [targetType, targetCategories, targetCustomers]);

  const selectedMedia = mediaItems.find((m) => m._id === media);

  const createAndSend = async (sendNow: boolean) => {
    setSaving(true);
    const created = await apiFetch<{ _id: string }>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        targetType,
        targetCategories,
        targetCustomers,
        message,
        media: media || undefined,
      }),
    });
    if (!created.success || !created.data) {
      setSaving(false);
      toast.error(created.error || 'Failed to save campaign');
      return;
    }
    if (sendNow) {
      const sent = await apiFetch(`/api/campaigns/${created.data._id}/send`, { method: 'POST' });
      setSaving(false);
      if (!sent.success) {
        toast.error(sent.error || 'Failed to send');
        router.push(`/campaigns/${created.data._id}`);
        return;
      }
      toast.success(`Campaign queued for ${count} customers`);
    } else {
      setSaving(false);
      toast.success('Draft saved');
    }
    router.push(`/campaigns/${created.data._id}`);
  };

  const canNext = () => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) {
      if (targetType === 'category') return targetCategories.length > 0;
      if (targetType === 'individual') return targetCustomers.length > 0;
      return true;
    }
    if (step === 2) return message.trim().length > 0;
    return true;
  };

  return (
    <div className="max-w-3xl space-y-5">
      <Link href="/campaigns" className="text-sm text-primary-600">
        ← Campaigns
      </Link>
      <h1 className="page-title">New Campaign</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => i <= step && setStep(i)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
              i === step ? 'bg-primary-600 text-white' : i < step ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div className="card p-6 space-y-4">
        {step === 0 && (
          <>
            <Input label="Campaign Name" required value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </>
        )}

        {step === 1 && (
          <>
            <Select
              label="Audience"
              options={[
                { value: 'all', label: 'All customers' },
                { value: 'category', label: 'Select categories' },
                { value: 'individual', label: 'Select individual customers' },
              ]}
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as typeof targetType)}
            />
            {targetType === 'category' && (
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() =>
                      setTargetCategories((prev) =>
                        prev.includes(c._id) ? prev.filter((id) => id !== c._id) : [...prev, c._id]
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      targetCategories.includes(c._id)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            {targetType === 'individual' && (
              <div className="space-y-2">
                <SearchInput
                  value={customerQuery}
                  onChange={setCustomerQuery}
                  placeholder="Search customers by name or phone"
                />
                <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                  {customers.map((c) => (
                    <label key={c._id} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={targetCustomers.includes(c._id)}
                        onChange={(e) =>
                          setTargetCustomers((prev) =>
                            e.target.checked ? [...prev, c._id] : prev.filter((id) => id !== c._id)
                          )
                        }
                      />
                      {c.name} — {c.whatsappNumber}
                    </label>
                  ))}
                  {customers.length === 0 && (
                    <p className="px-3 py-4 text-sm text-gray-500">No matching customers.</p>
                  )}
                </div>
                <p className="text-xs text-gray-500">{targetCustomers.length} selected</p>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Active matching customers: <strong>{count}</strong>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <Select
              label="Load from template"
              options={[{ value: '', label: 'None' }, ...templates.map((t) => ({ value: t._id, label: t.name }))]}
              onChange={(e) => {
                const t = templates.find((x) => x._id === e.target.value);
                if (t) {
                  setMessage(t.message);
                  if (t.media?._id) setMedia(t.media._id);
                }
              }}
            />
            <Textarea label="Message" required rows={8} value={message} onChange={(e) => setMessage(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  className="text-xs px-2 py-1 bg-gray-100 rounded"
                  onClick={() => setMessage((m) => m + v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Select
              label="Attach media"
              options={[{ value: '', label: 'No media' }, ...mediaItems.map((m) => ({ value: m._id, label: m.originalName }))]}
              value={media}
              onChange={(e) => setMedia(e.target.value)}
            />
            {selectedMedia?.fileType === 'image' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedMedia.url} alt="" className="max-h-48 rounded-lg border" />
            )}
            {selectedMedia && selectedMedia.fileType !== 'image' && (
              <p className="text-sm text-gray-600">
                {selectedMedia.fileType}: {selectedMedia.originalName}
              </p>
            )}
            <p className="text-xs text-gray-500">Upload files from Media Library if you need a new attachment.</p>
          </>
        )}

        {step === 4 && (
          <div className="space-y-3 text-sm">
            <p>
              <strong>Name:</strong> {name}
            </p>
            <p>
              <strong>Target:</strong> {targetType} — {count} customers
            </p>
            <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">{message}</div>
            {selectedMedia && (
              <p>
                Media: {selectedMedia.originalName} ({selectedMedia.fileType})
              </p>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <p className="text-sm">
              Ready to send <strong>{name}</strong> to <strong>{count}</strong> customers.
            </p>
            <p className="text-xs text-gray-500">
              Messages are queued and sent in the background with rate limiting. You can also save as draft.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </Button>
        {step < 5 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
            Next
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" loading={saving} onClick={() => createAndSend(false)}>
              Save draft
            </Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={count === 0}>
              Send campaign
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          createAndSend(true);
        }}
        title="Send campaign"
        message={`You are about to send this campaign to ${count} customers.`}
        confirmLabel="Send now"
        confirmVariant="primary"
        loading={saving}
      />
    </div>
  );
}
