import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  className?: string;
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
};

export function getStatusVariant(status: string): BadgeProps['variant'] {
  const map: Record<string, BadgeProps['variant']> = {
    active: 'success',
    inactive: 'default',
    pending: 'warning',
    sent: 'info',
    delivered: 'success',
    failed: 'danger',
    draft: 'default',
    scheduled: 'purple',
    sending: 'info',
    completed: 'success',
  };
  return map[status] || 'default';
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
