const PROBE_TIMEOUT_MS = 3000;

export async function probeApiReachable(
  fetchFn: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<boolean> {
  try {
    const res = await fetchFn('/api/health', {
      method: 'GET',
      cache: 'no-store',
      signal,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function probeOnline(fetchFn: typeof fetch = fetch): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    return await probeApiReachable(fetchFn, controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

export function countPendingOutbox(
  items: Array<{ status: string; retryCount?: number }>,
  maxRetries = 5,
): number {
  return items.filter((item) => {
    if (item.status === 'PENDING' || item.status === 'SENDING') return true;
    if (item.status === 'FAILED' && (item.retryCount ?? 0) < maxRetries) return true;
    return false;
  }).length;
}
