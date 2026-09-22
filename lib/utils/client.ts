export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options?.headers || {}),
    },
  });
  const json = (await res.json().catch(() => ({}))) as ApiResult<T>;
  if (!res.ok && !json.error) {
    return { success: false, error: res.statusText };
  }
  return json;
}
