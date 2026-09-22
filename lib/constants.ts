export const DEFAULT_CATEGORIES = [
  { name: 'AC', description: 'Air Conditioning systems', color: '#3b82f6', isDefault: true },
  { name: 'Chiller', description: 'Industrial and commercial chillers', color: '#06b6d4', isDefault: true },
  { name: 'Fridge', description: 'Refrigerators and commercial fridges', color: '#8b5cf6', isDefault: true },
  { name: 'Cold Room', description: 'Cold storage rooms', color: '#10b981', isDefault: true },
  { name: 'Water Cooler', description: 'Water coolers and dispensers', color: '#f59e0b', isDefault: true },
] as const;

export const MACHINE_TYPES = [
  'AC',
  'Chiller',
  'Fridge',
  'Cold Room',
  'Water Cooler',
  'Deep Freezer',
  'Display Cooler',
  'Other',
];

export const TEMPLATE_VARIABLES = [
  '{{customerName}}',
  '{{businessName}}',
  '{{machineType}}',
  '{{lastServiceDate}}',
  '{{nextServiceDate}}',
];

export const MAX_UPLOAD_BYTES: Record<'image' | 'video' | 'document', number> = {
  image: 5 * 1024 * 1024,
  video: 16 * 1024 * 1024,
  document: 100 * 1024 * 1024,
};

export const ALLOWED_MIME: Record<'image' | 'video' | 'document', string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/3gpp'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};
