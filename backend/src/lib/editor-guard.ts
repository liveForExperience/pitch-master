import type { Context } from 'hono';
import type { AppDb } from '../db/client.js';
import { fail } from './api-response.js';
import { EditorLeaseError } from './errors.js';
import { assertEditorLease } from '../services/editor-lease.service.js';

export function parseDeviceId(c: Context): string | undefined {
  const raw = c.req.header('X-Device-Id')?.trim();
  return raw || undefined;
}

export async function requireEditorLease(
  c: Context,
  db: AppDb,
  gameId: string,
): Promise<{ deviceId: string } | Response> {
  const deviceId = parseDeviceId(c);
  if (!deviceId) {
    return fail(c, 'editor_lease_required', 'X-Device-Id header required', 409);
  }

  try {
    await assertEditorLease(db, gameId, deviceId);
    return { deviceId };
  } catch (err) {
    if (err instanceof EditorLeaseError) {
      return fail(c, 'editor_lease_required', err.message, 409, err.data);
    }
    throw err;
  }
}
