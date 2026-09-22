'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Eye, Pencil, Plus, Trash2, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { apiFetch } from '@/lib/utils/client';
import { MessageTemplate } from '@/types/campaign';
import { Media } from '@/types/media';
import { TEMPLATE_VARIABLES } from '@/lib/constants';

const empty = {
  name: '',
  category: 'Service',
  message: '',
  media: '',
  status: 'active' as 'active' | 'inactive',
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<MessageTemplate | null>(null);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [t, m] = await Promise.all([apiFetch<MessageTemplate[]>('/api/templates'), apiFetch<Media[]>('/api/media?limit=50')]);
    if (t.data) setTemplates(t.data);
    if (m.data) setMediaItems(m.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    const payload = { ...form, media: form.media || undefined };
    const res = editing
      ? await apiFetch(`/api/templates/${editing._id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      : await apiFetch('/api/templates', { method: 'POST', body: JSON.stringify(payload) });
    setSaving(false);
    if (res.success) {
      toast.success('Template saved');
      setOpen(false);
      setEditing(null);
      load();
    } else toast.error(res.error || 'Failed');
  };

  const duplicate = async (id: string) => {
    const res = await apiFetch(`/api/templates/${id}/duplicate`, { method: 'POST' });
    if (res.success) {
      toast.success('Template duplicated');
      load();
    } else toast.error(res.error || 'Failed');
  };

  const remove = async () => {
    if (!deleteId) return;
    const res = await apiFetch(`/api/templates/${deleteId}`, { method: 'DELETE' });
    if (res.success) {
      toast.success('Deleted');
      setDeleteId(null);
      load();
    } else toast.error(res.error || 'Failed');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Message Templates</h1>
          <p className="text-sm text-gray-500">Reusable WhatsApp messages</p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditing(null);
            setForm(empty);
            setOpen(true);
          }}
        >
          New Template
        </Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : templates.length === 0 ? (
        <EmptyState icon={FileText} title="No templates" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {templates.map((t) => (
            <div key={t._id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.category}</p>
                </div>
                <Badge variant={getStatusVariant(t.status)}>{t.status}</Badge>
              </div>
              <p className="text-sm text-gray-600 mt-3 line-clamp-3 whitespace-pre-wrap">{t.message}</p>
              <div className="flex gap-1 mt-4">
                <button className="p-2 hover:bg-gray-100 rounded" onClick={() => setPreview(t)}>
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  className="p-2 hover:bg-gray-100 rounded"
                  onClick={() => {
                    setEditing(t);
                    setForm({
                      name: t.name,
                      category: t.category,
                      message: t.message,
                      media: t.media?._id || '',
                      status: t.status,
                    });
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded" onClick={() => duplicate(t._id)}>
                  <Copy className="h-4 w-4" />
                </button>
                <button className="p-2 hover:bg-red-50 rounded text-red-600" onClick={() => setDeleteId(t._id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit template' : 'New template'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Template Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Category" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Textarea label="Message" required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_VARIABLES.map((v) => (
              <button key={v} type="button" className="text-xs px-2 py-1 bg-gray-100 rounded" onClick={() => setForm({ ...form, message: form.message + v })}>
                {v}
              </button>
            ))}
          </div>
          <Select
            label="Media"
            options={[{ value: '', label: 'None' }, ...mediaItems.map((m) => ({ value: m._id, label: m.originalName }))]}
            value={form.media}
            onChange={(e) => setForm({ ...form, media: e.target.value })}
          />
          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
          />
        </div>
      </Modal>

      <Modal isOpen={!!preview} onClose={() => setPreview(null)} title={preview?.name} size="lg">
        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">{preview?.message}</pre>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete template" message="This template will be permanently deleted." />
    </div>
  );
}
