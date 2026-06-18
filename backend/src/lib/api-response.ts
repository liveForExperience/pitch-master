import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export type ApiErrorBody = {
  ok: false;
  error: { code: string; message: string };
};

export type ApiSuccessBody<T> = {
  ok: true;
  data: T;
};

export function ok<T>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  return c.json({ ok: true, data } satisfies ApiSuccessBody<T>, status);
}

export function fail(c: Context, code: string, message: string, status: ContentfulStatusCode = 400) {
  return c.json({ ok: false, error: { code, message } } satisfies ApiErrorBody, status);
}
