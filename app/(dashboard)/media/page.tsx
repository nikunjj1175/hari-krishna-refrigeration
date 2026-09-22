'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { apiFetch } from '@/lib/utils/client';
import { formatDate, formatFileSize } from '@/lib/utils';
import { Media } from '@/types/media';

export default function MediaPage() {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (fileType) params.set('fileType', fileType);
    const res = await apiFetch<Media[]>(`/api/media?${params}`);
    if (res.data) {
      setItems(res.data);
      if (res.pagination) setPagination(res.pagination);
    }
    setLoading(false);
  }, [page, fileType]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/media', { method: 'POST', body: form, credentials: 'include' });
    const json = await res.json();
    setUploading(false);
    if (json.success) {
      toast.success('Uploaded');
      load();
    } else toast.error(json.error || 'Upload failed');
  };

  const remove = async () => {
    if (!deleteId) return;
    const res = await apiFetch(`/api/media/${deleteId}`, { method: 'DELETE' });
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
          <h1 className="page-title">Media Library</h1>
          <p className="text-sm text-gray-500">Images, videos and documents uploaded to Cloudinary</p>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/3gpp,application/pdf,.doc,.docx,.xls,.xlsx"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <Button leftIcon={<Upload className="h-4 w-4" />} loading={uploading} onClick={() => inputRef.current?.click()}>
            Upload
          </Button>
        </div>
      </div>

      <div className="card p-4 max-w-xs">
        <Select
          options={[
            { value: '', label: 'All types' },
            { value: 'image', label: 'Images' },
            { value: 'video', label: 'Videos' },
            { value: 'document', label: 'Documents' },
          ]}
          value={fileType}
          onChange={(e) => { setFileType(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No media files" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 text-left">Preview</th>
                  <th className="px-4 py-3 text-left">File name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Size</th>
                  <th className="px-4 py-3 text-left">Uploaded</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((m) => (
                  <tr key={m._id}>
                    <td className="px-4 py-3">
                      {m.fileType === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt="" className="h-12 w-12 object-cover rounded" />
                      ) : (
                        <span className="uppercase text-xs text-gray-500">{m.fileType}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{m.originalName}</td>
                    <td className="px-4 py-3 capitalize">{m.fileType}</td>
                    <td className="px-4 py-3">{formatFileSize(m.fileSize)}</td>
                    <td className="px-4 py-3">{formatDate(m.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <a href={m.url} target="_blank" rel="noreferrer" className="text-primary-600 text-xs mr-2">
                        Open
                      </a>
                      <button className="p-2 hover:bg-red-50 rounded text-red-600" onClick={() => setDeleteId(m._id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={setPage} total={pagination.total} limit={pagination.limit} />
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete media" message="This file will be removed from storage." />
    </div>
  );
}
