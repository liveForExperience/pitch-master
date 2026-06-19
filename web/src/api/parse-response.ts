import type { ApiFailure, ApiSuccess } from './types';
import { getLocale } from '../i18n';

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function httpFail(status: number): string {
  return getLocale() === 'en'
    ? `Request failed (HTTP ${status})`
    : `请求失败（HTTP ${status}）`;
}
function pathDown(path: string): string {
  return getLocale() === 'en'
    ? `Endpoint unavailable: ${path}`
    : `接口不可用：${path}`;
}
function emptyResponse(status: number): string {
  if (status >= 500 || status === 502) {
    return getLocale() === 'en'
      ? 'Backend did not respond. Make sure it is running (bash bin/dev.sh).'
      : '后端服务未响应，请确认 backend 已启动（bash bin/dev.sh）';
  }
  return getLocale() === 'en'
    ? `Empty response from server (HTTP ${status})`
    : `服务器返回空响应（HTTP ${status}）`;
}
function badJson(status: number): string {
  return getLocale() === 'en'
    ? `Malformed server response (HTTP ${status})`
    : `服务器响应格式异常（HTTP ${status}）`;
}

export function parseApiFailure(body: unknown, status: number): ApiError {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const nested = record.error;
    if (nested && typeof nested === 'object') {
      const err = nested as { code?: string; message?: string };
      return new ApiError(err.code ?? 'api_error', err.message ?? httpFail(status));
    }
    if (typeof nested === 'string') {
      const path = typeof record.path === 'string' ? record.path : '';
      return new ApiError(nested, path ? pathDown(path) : `${httpFail(status)}: ${nested}`);
    }
  }
  return new ApiError('unknown_error', httpFail(status));
}

export function parseApiResponse<T>(text: string, status: number): T {
  if (!text.trim()) {
    throw new ApiError('empty_response', emptyResponse(status));
  }

  let body: unknown;
  try {
    body = JSON.parse(text) as ApiSuccess<T> | ApiFailure;
  } catch {
    throw new ApiError('invalid_json', badJson(status));
  }

  if (!body || typeof body !== 'object' || !('ok' in body) || (body as ApiSuccess<T>).ok !== true) {
    throw parseApiFailure(body, status);
  }

  return (body as ApiSuccess<T>).data;
}
