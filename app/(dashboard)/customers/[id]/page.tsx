'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Pencil, Plus, Trash2, Send } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { apiFetch } from '@/lib/utils/client';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Customer, Machine } from '@/types/customer';
import { MessageLog } from '@/types/campaign';
import { Media } from '@/types/media';
import { MACHINE_TYPES } from '@/lib/constants';

const emptyMachine = {
  type: 'AC',
  brand: '',
  model: '',
  capacity: '',
  quantity: 1,
  installationDate: '',
  lastServiceDate: '',
  nextServiceDate: '',
  notes: '',
};

export default function CustomerDetailsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [machineOpen, setMachineOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [machineForm, setMachineForm] = useState(emptyMachine);
  const [savingMachine, setSavingMachine] = useState(false);
  const [deleteMachineId, setDeleteMachineId] = useState<string | null>(null);
  const [messageOpen, setMessageOpen] = useState(searchParams.get('message') === '1');
  const [message, setMessage] = useState(
    'Dear {{customerName}},\n\nThis is Hari Krishna Refrigeration.\nPlease contact us for service support.'
  );
  const [sending, setSending] = useState(false);
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [mediaId, setMediaId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [c, m, l] = await Promise.all([
      apiFetch<Customer>(`/api/customers/${params.id}`),
      apiFetch<Machine[]>(`/api/machines?customerId=${params.id}`),
      apiFetch<MessageLog[]>(`/api/messages?customerId=${params.id}&limit=50`),
    ]);
    if (c.success && c.data) setCustomer(c.data);
    if (m.success && m.data) setMachines(m.data);
    if (l.success && l.data) setLogs(l.data);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
    apiFetch<Media[]>('/api/media?limit=50').then((res) => {
      if (res.success && res.data) setMediaItems(res.data);
    });
  }, [load]);

  const saveMachine = async () => {
    setSavingMachine(true);
    const payload = { ...machineForm, customerId: params.id, quantity: Number(machineForm.quantity) };
    const res = editingMachine
      ? await apiFetch(`/api/machines/${editingMachine._id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      : await apiFetch('/api/machines', { method: 'POST', body: JSON.stringify(payload) });
    setSavingMachine(false);
    if (res.success) {
      toast.success(editingMachine ? 'Machine updated' : 'Machine added');
      setMachineOpen(false);
      setEditingMachine(null);
      setMachineForm(emptyMachine);
      load();
    } else {
      toast.error(res.error || 'Failed to save machine');
    }
  };

  const deleteMachine = async () => {
    if (!deleteMachineId) return;
    const res = await apiFetch(`/api/machines/${deleteMachineId}`, { method: 'DELETE' });
    if (res.success) {
      toast.success('Machine deleted');
      setDeleteMachineId(null);
      load();
    } else toast.error(res.error || 'Failed to delete');
  };

  const sendMessage = async () => {
    setSending(true);
    const res = await apiFetch(`/api/customers/${params.id}/message`, {
      method: 'POST',
      body: JSON.stringify({ message, media: mediaId || undefined }),
    });
    setSending(false);
    if (res.success) {
      toast.success('WhatsApp message sent');
      setMessageOpen(false);
      load();
    } else toast.error(res.error || 'Send failed');
  };

  if (loading) return <PageLoader />;
  if (!customer) {
    return (
      <EmptyState
        title="Customer not found"
        description="This customer may have been deleted."
        actionLabel="Back to customers"
        onAction={() => (window.location.href = '/customers')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <Link href="/customers" className="text-sm text-primary-600">
            ← Customers
          </Link>
          <h1 className="page-title mt-1">{customer.name}</h1>
          <p className="text-sm text-gray-500">{customer.customerCode}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<Send className="h-4 w-4" />} onClick={() => setMessageOpen(true)}>
            Send WhatsApp
          </Button>
          <Link href={`/customers/${customer._id}/edit`}>
            <Button leftIcon={<Pencil className="h-4 w-4" />}>Edit</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 space-y-3">
          <h2 className="section-title">Customer information</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Business</dt>
              <dd className="font-medium">{customer.businessName || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="font-medium">{customer.phone}</dd>
            </div>
            <div>
              <dt className="text-gray-500">WhatsApp</dt>
              <dd className="font-medium">{customer.whatsappNumber}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium">{customer.email || '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500">Address</dt>
              <dd className="font-medium">
                {[customer.address?.addressLine, customer.address?.city, customer.address?.state, customer.address?.pincode]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Status</dt>
              <dd>
                <Badge variant={getStatusVariant(customer.status)}>{customer.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Categories</dt>
              <dd className="flex flex-wrap gap-1 mt-1">
                {(customer.categories || []).map((c) => (
                  <Badge key={c._id}>{c.name}</Badge>
                ))}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500">Notes</dt>
              <dd>{customer.notes || '—'}</dd>
            </div>
          </dl>
        </div>
        <div className="card p-6 text-sm space-y-2">
          <h2 className="section-title">Meta</h2>
          <p>Created: {formatDateTime(customer.createdAt)}</p>
          <p>Updated: {formatDateTime(customer.updatedAt)}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="section-title">Machines</h2>
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditingMachine(null);
              setMachineForm(emptyMachine);
              setMachineOpen(true);
            }}
          >
            Add Machine
          </Button>
        </div>
        {machines.length === 0 ? (
          <EmptyState title="No machines" description="Add AC, chiller, fridge or other equipment." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Brand / Model</th>
                  <th className="px-4 py-3 text-left">Capacity</th>
                  <th className="px-4 py-3 text-left">Qty</th>
                  <th className="px-4 py-3 text-left">Last Service</th>
                  <th className="px-4 py-3 text-left">Next Service</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {machines.map((m) => (
                  <tr key={m._id}>
                    <td className="px-4 py-3 font-medium">{m.type}</td>
                    <td className="px-4 py-3">
                      {m.brand || '—'} {m.model ? `/ ${m.model}` : ''}
                    </td>
                    <td className="px-4 py-3">{m.capacity || '—'}</td>
                    <td className="px-4 py-3">{m.quantity}</td>
                    <td className="px-4 py-3">{formatDate(m.lastServiceDate)}</td>
                    <td className="px-4 py-3">{formatDate(m.nextServiceDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="p-2 hover:bg-gray-100 rounded"
                        onClick={() => {
                          setEditingMachine(m);
                          setMachineForm({
                            type: m.type,
                            brand: m.brand || '',
                            model: m.model || '',
                            capacity: m.capacity || '',
                            quantity: m.quantity,
                            installationDate: m.installationDate?.slice(0, 10) || '',
                            lastServiceDate: m.lastServiceDate?.slice(0, 10) || '',
                            nextServiceDate: m.nextServiceDate?.slice(0, 10) || '',
                            notes: m.notes || '',
                          });
                          setMachineOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded text-red-600" onClick={() => setDeleteMachineId(m._id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="section-title">Communication history</h2>
        </div>
        {logs.length === 0 ? (
          <EmptyState title="No messages yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 text-left">Campaign</th>
                  <th className="px-4 py-3 text-left">Message</th>
                  <th className="px-4 py-3 text-left">Media</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Sent</th>
                  <th className="px-4 py-3 text-left">Delivered</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="px-4 py-3">{log.campaign?.name || 'Direct'}</td>
                    <td className="px-4 py-3 max-w-sm truncate">{log.message}</td>
                    <td className="px-4 py-3">{log.media?.originalName || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(log.status)}>{log.status}</Badge>
                    </td>
                    <td className="px-4 py-3">{formatDateTime(log.sentAt || log.createdAt)}</td>
                    <td className="px-4 py-3">{formatDateTime(log.deliveredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={machineOpen}
        onClose={() => setMachineOpen(false)}
        title={editingMachine ? 'Edit machine' : 'Add machine'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setMachineOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveMachine} loading={savingMachine}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label="Machine Type"
            required
            options={MACHINE_TYPES.map((t) => ({ value: t, label: t }))}
            value={machineForm.type}
            onChange={(e) => setMachineForm({ ...machineForm, type: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Brand" value={machineForm.brand} onChange={(e) => setMachineForm({ ...machineForm, brand: e.target.value })} />
            <Input label="Model" value={machineForm.model} onChange={(e) => setMachineForm({ ...machineForm, model: e.target.value })} />
            <Input label="Capacity" value={machineForm.capacity} onChange={(e) => setMachineForm({ ...machineForm, capacity: e.target.value })} />
            <Input
              label="Quantity"
              type="number"
              min={1}
              value={machineForm.quantity}
              onChange={(e) => setMachineForm({ ...machineForm, quantity: Number(e.target.value) })}
            />
            <Input
              label="Installation Date"
              type="date"
              value={machineForm.installationDate}
              onChange={(e) => setMachineForm({ ...machineForm, installationDate: e.target.value })}
            />
            <Input
              label="Last Service Date"
              type="date"
              value={machineForm.lastServiceDate}
              onChange={(e) => setMachineForm({ ...machineForm, lastServiceDate: e.target.value })}
            />
            <Input
              label="Next Service Date"
              type="date"
              value={machineForm.nextServiceDate}
              onChange={(e) => setMachineForm({ ...machineForm, nextServiceDate: e.target.value })}
            />
          </div>
          <Textarea label="Notes" value={machineForm.notes} onChange={(e) => setMachineForm({ ...machineForm, notes: e.target.value })} />
        </div>
      </Modal>

      <Modal
        isOpen={messageOpen}
        onClose={() => setMessageOpen(false)}
        title="Send WhatsApp message"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMessageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendMessage} loading={sending}>
              Send
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Textarea label="Message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} />
          <p className="text-xs text-gray-500">Variables: {'{{customerName}} {{businessName}} {{machineType}}'}</p>
          <Select
            label="Media (optional)"
            options={[{ value: '', label: 'None' }, ...mediaItems.map((m) => ({ value: m._id, label: m.originalName }))]}
            value={mediaId}
            onChange={(e) => setMediaId(e.target.value)}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteMachineId}
        onClose={() => setDeleteMachineId(null)}
        onConfirm={deleteMachine}
        title="Delete machine"
        message="Remove this machine from the customer record?"
      />
    </div>
  );
}
