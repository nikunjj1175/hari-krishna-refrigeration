import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/shared/DashboardLayout';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return <DashboardLayout>{children}</DashboardLayout>;
}
