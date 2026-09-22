'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { apiFetch } from '@/lib/utils/client';
import { Category } from '@/types/customer';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '', color: '#3b82f6' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await apiFetch<Category[]>('/api/categories');
    if (res.success && res.data) setCategories(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    const res = editing
      ? await apiFetch(`/api/categories/${editing._id}`, { method: 'PATCH', body: JSON.stringify(form) })
      : await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify(form) });
    setSaving(false);
    if (res.success) {
      toast.success(editing ? 'Category updated' : 'Category created');
      setOpen(false);
      setEditing(null);
      load();
    } else toast.error(res.error || 'Failed');
  };

  const remove = async () => {
    if (!deleteId) return;
    const res = await apiFetch(`/api/categories/${deleteId}`, { method: 'DELETE' });
    if (res.success) {
      toast.success('Category deleted');
      setDeleteId(null);
      load();
    } else toast.error(res.error || 'Cannot delete');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="text-sm text-gray-500">Organize customers by equipment type</p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditing(null);
            setForm({ name: '', description: '', color: '#3b82f6' });
            setOpen(true);
          }}
        >
          Add Category
        </Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : categories.length === 0 ? (
        <EmptyState icon={Tag} title="No categories" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c._id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.description || (c.isDefault ? 'Default category' : '')}</p>
                  </div>
                </div>
                <div className="flex">
                  <button
                    className="p-2 hover:bg-gray-100 rounded"
                    onClick={() => {
                      setEditing(c);
                      setForm({ name: c.name, description: c.description || '', color: c.color });
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-red-50 rounded text-red-600" onClick={() => setDeleteId(c._id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-2xl font-bold mt-4">{c.customerCount || 0}</p>
              <p className="text-xs text-gray-500">active customers</p>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit category' : 'Add category'}
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
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Color" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        title="Delete category"
        message="This category will be removed from all customers."
      />
    </div>
  );
}
