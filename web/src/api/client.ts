import type { ApiFailure, ApiSuccess } from './types';

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

type RequestOpts = RequestInit & { adminToken?: string | null; pin?: string };

function buildUrl(path: string, pin?: string): string {
  if (!pin) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}pin=${encodeURIComponent(pin)}`;
}

export async function apiRequest<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  if (opts.adminToken) headers.set('Authorization', `Bearer ${opts.adminToken}`);
  if (opts.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(buildUrl(path, opts.pin), { ...opts, headers });
  const newToken = res.headers.get('X-New-Admin-Token');
  if (newToken) {
    window.dispatchEvent(new CustomEvent('pitchmaster:new-admin-token', { detail: newToken }));
  }

  const body = (await res.json()) as ApiSuccess<T> | ApiFailure;
  if (!body.ok) throw new ApiError(body.error.code, body.error.message);
  return body.data;
}

export function newClientEventId(): string {
  return crypto.randomUUID();
}
