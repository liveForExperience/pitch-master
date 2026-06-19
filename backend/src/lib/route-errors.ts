import type { Context } from 'hono';
import { fail } from './api-response.js';
import { ConflictError, NotFoundError, ValidationError } from './errors.js';

/** 将 service 层已知错误映射为 HTTP 响应；未知错误返回 null 由调用方抛出 */
export function mapServiceError(c: Context, err: unknown): Response | null {
  if (err instanceof NotFoundError) return fail(c, 'not_found', err.message, 404);
  if (err instanceof ConflictError) return fail(c, 'conflict', err.message, 409);
  if (err instanceof ValidationError) return fail(c, 'validation_error', err.message, 400);
  return null;
}

export function applyNewAdminToken(res: Response, token?: string): Response {
  if (token) res.headers.set('X-New-Admin-Token', token);
  return res;
}
