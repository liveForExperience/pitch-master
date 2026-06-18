import { Hono } from 'hono';
import { getDb } from '../db/client.js';
import { requireTeamAdmin } from '../lib/admin-auth.js';
import { fail, ok } from '../lib/api-response.js';
import { ValidationError, addRosterMembers } from '../services/game-ops.service.js';

export const teamsRoute = new Hono();

teamsRoute.post('/teams/:id/roster', async (c) => {
  const teamId = c.req.param('id');
  const db = getDb();
  const auth = await requireTeamAdmin(c, db, teamId);
  if (auth instanceof Response) return auth;

  const body = await c.req.json<{ names?: string[] }>().catch(() => ({}));
  if (!body.names?.length) return fail(c, 'validation_error', 'names array is required', 400);

  try {
    const data = await addRosterMembers(db, teamId, body.names);
    const res = ok(c, { added: data }, 201);
    if (auth.newAdminToken) res.headers.set('X-New-Admin-Token', auth.newAdminToken);
    return res;
  } catch (err) {
    if (err instanceof ValidationError) return fail(c, 'validation_error', err.message, 400);
    throw err;
  }
});
