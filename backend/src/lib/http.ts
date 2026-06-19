import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export async function readJson<T>(c: Context): Promise<T> {
  return c.req.json<T>();
}

export function httpStatus(status: number): ContentfulStatusCode {
  return status as ContentfulStatusCode;
}
