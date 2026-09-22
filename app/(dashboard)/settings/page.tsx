'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { apiFetch } from '@/lib/utils/client';
import { PageLoader } from '@/components/ui/LoadingSpinner';

interface SettingsPayload {
  values: { businessName: string; defaultState: string; rateDelayMs: number };
  whatsappConfigured: boolean;
  storageProvider: string;
  cloudinaryConfigured: boolean;
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsPayload | null>(null);
  const [form, setForm] = useState({ businessName: '', defaultState: '', rateDelayMs: 250 });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<SettingsPayload>('/api/settings').then((res) => {
      if (res.data) {
        setData(res.data);
        setForm(res.data.values);
      }
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await apiFetch('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify({ ...form, rateDelayMs: Number(form.rateDelayMs) }),
    });
    setSaving(false);
    if (res.success) toast.success('Settings saved');
    else toast.error(res.error || 'Failed');
  };

  const changePassword = async () => {
    const res = await apiFetch('/api/settings/password', {
      method: 'POST',
      body: JSON.stringify(passwords),
    });
    if (res.success) {
      toast.success('Password updated');
      setPasswords({ currentPassword: '', newPassword: '' });
    } else toast.error(res.error || 'Failed');
  };

  if (!data) return <PageLoader />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-gray-500">Business and WhatsApp configuration</p>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="section-title">Business</h2>
        <Input label="Business Name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
        <Input label="Default State" value={form.defaultState} onChange={(e) => setForm({ ...form, defaultState: e.target.value })} />
        <Input
          label="WhatsApp send delay (ms)"
          type="number"
          hint="Used to respect Cloud API rate limits for large campaigns"
          value={form.rateDelayMs}
          onChange={(e) => setForm({ ...form, rateDelayMs: Number(e.target.value) })}
        />
        <Button onClick={save} loading={saving}>
          Save settings
        </Button>
      </div>

      <div className="card p-6 space-y-3">
        <h2 className="section-title">Integrations</h2>
        <p className="text-sm">
          WhatsApp Cloud API:{' '}
          <strong className={data.whatsappConfigured ? 'text-green-700' : 'text-red-600'}>
            {data.whatsappConfigured ? 'Configured' : 'Not configured'}
          </strong>
        </p>
        <p className="text-sm">
          Cloudinary:{' '}
          <strong className={data.cloudinaryConfigured ? 'text-green-700' : 'text-red-600'}>
            {data.cloudinaryConfigured ? 'Configured' : 'Not configured'}
          </strong>
        </p>
        <p className="text-sm text-gray-600">Storage provider: {data.storageProvider}</p>
        <p className="text-xs text-gray-500">
          Photos and media are uploaded to Cloudinary. API tokens stay in server environment variables and are never
          shown in the browser. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local.
        </p>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="section-title">Change password</h2>
        <Input
          label="Current password"
          type="password"
          value={passwords.currentPassword}
          onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
        />
        <Input
          label="New password"
          type="password"
          value={passwords.newPassword}
          onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
        />
        <Button variant="secondary" onClick={changePassword}>
          Update password
        </Button>
      </div>
    </div>
  );
}
