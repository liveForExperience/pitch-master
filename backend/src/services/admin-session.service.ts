import type { AppDb } from '../db/client.js';
import { AuthError } from '../lib/errors.js';
import { resolveEventAdmin } from './event.service.js';
import { resolveEventId } from './report.service.js';

export type AdminSessionRole = 'viewer' | 'admin';
export type AdminTokenStatus = 'none' | 'valid' | 'invalid';

export type AdminSessionResult = {
  eventId: string;
  role: AdminSessionRole;
  tokenStatus: AdminTokenStatus;
};

/** Resolve whether the caller may show admin UI based on server-side token hash. */
export async function getAdminSession(
  db: AppDb,
  idOrShortCode: string,
  opts: { bearerToken?: string },
): Promise<AdminSessionResult> {
  const eventId = await resolveEventId(db, idOrShortCode);
  let tokenStatus: AdminTokenStatus = 'none';

  if (opts.bearerToken) {
    try {
      await resolveEventAdmin(db, eventId, { bearerToken: opts.bearerToken });
      tokenStatus = 'valid';
    } catch (err) {
      if (err instanceof AuthError) tokenStatus = 'invalid';
      else throw err;
    }
  }

  return {
    eventId,
    role: tokenStatus === 'valid' ? 'admin' : 'viewer',
    tokenStatus,
  };
}
