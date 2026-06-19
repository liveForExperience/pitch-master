import type { ApiFailure, ApiSuccess } from './types';

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export function parseApiFailure(body: unknown, status: number): ApiError {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const nested = record.error;
    if (nested && typeof nested === 'object') {
      const err = nested as { code?: string; message?: string };
      return new ApiError(err.code ?? 'api_error', err.message ?? `请求失败（HTTP ${status}）`);
    }
    if (typeof nested === 'string') {
      const path = typeof record.path === 'string' ? record.path : '';
      return new ApiError(nested, path ? `接口不可用：${path}` : `请求失败：${nested}`);
    }
  }
  return new ApiError('unknown_error', `请求失败（HTTP ${status}）`);
}

export function parseApiResponse<T>(text: string, status: number): T {
  if (!text.trim()) {
    throw new ApiError(
      'empty_response',
      status >= 500 || status === 502
        ? '后端服务未响应，请确认 backend 已启动（bash bin/dev.sh）'
        : `服务器返回空响应（HTTP ${status}）`,
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(text) as ApiSuccess<T> | ApiFailure;
  } catch {
    throw new ApiError('invalid_json', `服务器响应格式异常（HTTP ${status}）`);
  }

  if (!body || typeof body !== 'object' || !('ok' in body) || (body as ApiSuccess<T>).ok !== true) {
    throw parseApiFailure(body, status);
  }

  return (body as ApiSuccess<T>).data;
}
