import { Hono } from 'hono';
import { getDb } from '../db/client.js';
import { requireTeamAdmin } from '../lib/admin-auth.js';
import { fail, ok } from '../lib/api-response.js';
import { readJson } from '../lib/http.js';
import { applyNewAdminToken, mapServiceError } from '../lib/route-errors.js';
import {
  addRosterMembers,
  deleteTeam,
  removeRosterMember,
  updateTeam,
} from '../services/game-ops.service.js';
import { rosters } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const teamsRoute = new Hono();

teamsRoute.patch('/teams/:id', async (c) => {
  const teamId = c.req.param('id');
  const db = getDb();
  const auth = await requireTeamAdmin(c, db, teamId);
  if (auth instanceof Response) return auth;

  const body = await readJson<{ name?: string }>(c);
  if (!body.name?.trim()) return fail(c, 'validation_error', 'name is required', 400);

  try {
    const data = await updateTeam(db, teamId, { name: body.name.trim() });
    return applyNewAdminToken(ok(c, data), auth.newAdminToken);
  } catch (err) {
    const mapped = mapServiceError(c, err);
    if (mapped) return mapped;
    throw err;
  }
});

teamsRoute.delete('/teams/:id', async (c) => {
  const teamId = c.req.param('id');
  const db = getDb();
  const auth = await requireTeamAdmin(c, db, teamId);
  if (auth instanceof Response) return auth;

  try {
    const data = await deleteTeam(db, teamId);
    return applyNewAdminToken(ok(c, data), auth.newAdminToken);
  } catch (err) {
    const mapped = mapServiceError(c, err);
    if (mapped) return mapped;
    throw err;
  }
});

teamsRoute.post('/teams/:id/roster', async (c) => {
  const teamId = c.req.param('id');
  const db = getDb();
  const auth = await requireTeamAdmin(c, db, teamId);
  if (auth instanceof Response) return auth;

  const body = await readJson<{ names?: string[]; personIds?: string[] }>(c);
  if (!body.names?.length && !body.personIds?.length) {
    return fail(c, 'validation_error', 'names or personIds is required', 400);
  }

  try {
    const data = await addRosterMembers(db, teamId, {
      names: body.names,
      personIds: body.personIds,
    });
    const res = ok(c, { added: data }, 201);
    if (auth.newAdminToken) res.headers.set('X-New-Admin-Token', auth.newAdminToken);
    return res;
  } catch (err) {
    const mapped = mapServiceError(c, err);
    if (mapped) return mapped;
    throw err;
  }
});

teamsRoute.delete('/roster/:id', async (c) => {
  const rosterId = c.req.param('id');
  const db = getDb();
  const [member] = await db.select().from(rosters).where(eq(rosters.id, rosterId)).limit(1);
  if (!member) return fail(c, 'not_found', 'Roster member not found', 404);

  const auth = await requireTeamAdmin(c, db, member.teamId);
  if (auth instanceof Response) return auth;

  try {
    const data = await removeRosterMember(db, rosterId);
    return applyNewAdminToken(ok(c, data), auth.newAdminToken);
  } catch (err) {
    const mapped = mapServiceError(c, err);
    if (mapped) return mapped;
    throw err;
  }
});
