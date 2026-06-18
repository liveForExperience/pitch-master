import type { Context } from 'hono';

export type ApiErrorBody = {
  ok: false;
  error: { code: string; message: string };
};

export type ApiSuccessBody<T> = {
  ok: true;
  data: T;
};

export function ok<T>(c: Context, data: T, status: 200 | 201 = 200) {
  return c.json({ ok: true, data } satisfies ApiSuccessBody<T>, status);
}

export function fail(c: Context, code: string, message: string, status = 400) {
  return c.json({ ok: false, error: { code, message } } satisfies ApiErrorBody, status);
}
