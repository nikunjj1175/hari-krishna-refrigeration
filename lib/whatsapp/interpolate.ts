import { formatDate, interpolateMessage } from '@/lib/utils';

type CustomerVars = { name?: string; businessName?: string };
type MachineVars = {
  type?: string;
  lastServiceDate?: Date | string | null;
  nextServiceDate?: Date | string | null;
};

export function buildMessageVariables(
  customer: CustomerVars,
  machines: unknown[] = []
): Record<string, string> {
  const list = machines as MachineVars[];
  const types = Array.from(
    new Set(list.map((m) => m.type).filter((type): type is string => Boolean(type)))
  );
  const lastService = list
    .map((m) => m.lastServiceDate)
    .filter(Boolean)
    .sort((a, b) => new Date(b as Date).getTime() - new Date(a as Date).getTime())[0];
  const nextService = list
    .map((m) => m.nextServiceDate)
    .filter(Boolean)
    .sort((a, b) => new Date(a as Date).getTime() - new Date(b as Date).getTime())[0];

  return {
    customerName: customer.name || '',
    businessName: customer.businessName || customer.name || '',
    machineType: types.join(', ') || 'equipment',
    lastServiceDate: lastService ? formatDate(lastService) : 'N/A',
    nextServiceDate: nextService ? formatDate(nextService) : 'N/A',
  };
}

export function renderCustomerMessage(
  template: string,
  customer: CustomerVars,
  machines: unknown[] = []
): string {
  return interpolateMessage(template, buildMessageVariables(customer, machines));
}
