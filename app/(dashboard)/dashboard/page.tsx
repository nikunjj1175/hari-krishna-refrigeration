'use client';

import { useEffect, useState } from 'react';
import { Users, Megaphone, Send, CheckCircle2, XCircle, Snowflake } from 'lucide-react';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import Badge, { getStatusVariant } from '@/components/ui/Badge';
import { apiFetch } from '@/lib/utils/client';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface DashboardData {
  totals: {
    customers: number;
    campaigns: number;
    messagesSent: number;
    delivered: number;
    failed: number;
    pending: number;
  };
  categoryCounts: { name: string; count: number; color: string }[];
  recentCustomers: Array<{
    _id: string;
    name: string;
    businessName?: string;
    phone: string;
    createdAt: string;
  }>;
  recentCampaigns: Array<{
    _id: string;
    name: string;
    status: string;
    totalRecipients: number;
    createdAt: string;
  }>;
  campaignByStatus: { _id: string; count: number }[];
  deliveryStats: { name: string; value: number }[];
}

const PIE_COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'];

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<DashboardData>('/api/dashboard').then((res) => {
      if (res.success && res.data) setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <PageLoader text="Loading dashboard..." />;
  if (!data) return <p className="text-red-600">Failed to load dashboard.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Hari Krishna Refrigeration overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Customers"
          value={data.totals.customers}
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Total Campaigns"
          value={data.totals.campaigns}
          icon={Megaphone}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          label="Messages Sent"
          value={data.totals.messagesSent}
          icon={Send}
          color="bg-sky-50 text-sky-600"
        />
        <StatCard
          label="Delivered"
          value={data.totals.delivered}
          icon={CheckCircle2}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          label="Failed"
          value={data.totals.failed}
          icon={XCircle}
          color="bg-red-50 text-red-600"
        />
      </div>

      <div>
        <h2 className="section-title mb-3">Customers by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {data.categoryCounts.map((c) => (
            <div key={c.name} className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Snowflake className="h-4 w-4" style={{ color: c.color }} />
                <p className="text-sm font-medium text-gray-700">{c.name}</p>
              </div>
              <p className="text-2xl font-bold">{c.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="section-title mb-4">Message delivery</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.deliveryStats.filter((d) => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {data.deliveryStats.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="section-title mb-4">Campaigns by status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.campaignByStatus.map((s) => ({ name: s._id, count: s.count }))}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="section-title">Recent customers</h2>
            <Link href="/customers" className="text-sm text-primary-600">
              View all
            </Link>
          </div>
          <div className="divide-y">
            {data.recentCustomers.length === 0 && (
              <p className="p-5 text-sm text-gray-500">No customers yet.</p>
            )}
            {data.recentCustomers.map((c) => (
              <Link
                key={c._id}
                href={`/customers/${c._id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.businessName || c.phone}</p>
                </div>
                <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="section-title">Recent campaigns</h2>
            <Link href="/campaigns" className="text-sm text-primary-600">
              View all
            </Link>
          </div>
          <div className="divide-y">
            {data.recentCampaigns.length === 0 && (
              <p className="p-5 text-sm text-gray-500">No campaigns yet.</p>
            )}
            {data.recentCampaigns.map((c) => (
              <Link
                key={c._id}
                href={`/campaigns/${c._id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.totalRecipients} recipients</p>
                </div>
                <Badge variant={getStatusVariant(c.status)}>{c.status}</Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
