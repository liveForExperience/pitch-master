import { ApiError, parseApiResponse } from './parse-response';
import { randomUUID } from '../lib/uuid';
import { t } from '../i18n';

export { ApiError };

type RequestOpts = RequestInit & {
  adminToken?: string | null;
  pin?: string;
  deviceId?: string | null;
};

function buildUrl(path: string, pin?: string): string {
  if (!pin) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}pin=${encodeURIComponent(pin)}`;
}

export async function apiRequest<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  if (opts.adminToken) headers.set('Authorization', `Bearer ${opts.adminToken}`);
  if (opts.deviceId) headers.set('X-Device-Id', opts.deviceId);
  if (opts.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.pin), { ...opts, headers });
  } catch {
    throw new ApiError('network_error', t('common.error.network'));
  }

  const newToken = res.headers.get('X-New-Admin-Token');
  if (newToken) {
    window.dispatchEvent(new CustomEvent('pitchmaster:new-admin-token', { detail: newToken }));
  }

  const text = await res.text();
  return parseApiResponse<T>(text, res.status);
}

export function newClientEventId(): string {
  return randomUUID();
}
