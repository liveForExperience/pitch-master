import { randomUUID } from './uuid';

const STORAGE_KEY = 'pm:deviceId';

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing?.trim()) return existing;
    const id = randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return randomUUID();
  }
}

/** Last 4 chars for display — not a secret, just a handle. */
export function formatDeviceTail(deviceId: string | null | undefined): string {
  if (!deviceId) return '—';
  const tail = deviceId.replace(/-/g, '').slice(-4).toUpperCase();
  return tail || '—';
}
