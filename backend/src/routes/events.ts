import { Hono } from 'hono';
import { getDb } from '../db/client.js';
import { requireEventAdmin } from '../lib/admin-auth.js';
import { fail, ok } from '../lib/api-response.js';
import { readJson } from '../lib/http.js';
import { applyNewAdminToken, mapServiceError } from '../lib/route-errors.js';
import { createEvent, finishEvent } from '../services/event.service.js';
import {
  createGame,
  createTeam,
  getEventByShortCode,
} from '../services/game-ops.service.js';

export const eventsRoute = new Hono();

eventsRoute.post('/events', async (c) => {
  const body = await readJson<{ name?: string }>(c);
  if (!body.name?.trim()) return fail(c, 'validation_error', 'name is required', 400);
  const db = getDb();
  const data = await createEvent(db, body.name.trim());
  return ok(c, data, 201);
});

eventsRoute.get('/events/:shortCode', async (c) => {
  const db = getDb();
  try {
    const data = await getEventByShortCode(db, c.req.param('shortCode'));
    return ok(c, data);
  } catch (err) {
    const mapped = mapServiceError(c, err);
    if (mapped) return mapped;
    throw err;
  }
});

eventsRoute.post('/events/:id/teams', async (c) => {
  const eventId = c.req.param('id');
  const db = getDb();
  const auth = await requireEventAdmin(c, db, eventId);
  if (auth instanceof Response) return auth;

  const body = await readJson<{ name?: string; colorHex?: string }>(c);
  if (!body.name?.trim()) return fail(c, 'validation_error', 'name is required', 400);

  const data = await createTeam(db, eventId, { name: body.name.trim(), colorHex: body.colorHex });
  return applyNewAdminToken(ok(c, data, 201), auth.newAdminToken);
});

eventsRoute.post('/events/:id/games', async (c) => {
  const eventId = c.req.param('id');
  const db = getDb();
  const auth = await requireEventAdmin(c, db, eventId);
  if (auth instanceof Response) return auth;

  const body = await readJson<{
    teamAId?: string;
    teamBId?: string;
    plannedDurationMs?: number;
  }>(c);
  if (!body.teamAId || !body.teamBId) {
    return fail(c, 'validation_error', 'teamAId and teamBId are required', 400);
  }

  try {
    const data = await createGame(db, eventId, {
      teamAId: body.teamAId,
      teamBId: body.teamBId,
      plannedDurationMs: body.plannedDurationMs,
    });
    return applyNewAdminToken(ok(c, data, 201), auth.newAdminToken);
  } catch (err) {
    const mapped = mapServiceError(c, err);
    if (mapped) return mapped;
    throw err;
  }
});

eventsRoute.post('/events/:id/finish', async (c) => {
  const eventId = c.req.param('id');
  const db = getDb();
  const auth = await requireEventAdmin(c, db, eventId);
  if (auth instanceof Response) return auth;

  try {
    const data = await finishEvent(db, eventId);
    return applyNewAdminToken(ok(c, data), auth.newAdminToken);
  } catch (err) {
    const mapped = mapServiceError(c, err);
    if (mapped) return mapped;
    throw err;
  }
});

eventsRoute.post('/events/:id/restore-token', async (c) => {
  const eventId = c.req.param('id');
  const db = getDb();
  const auth = await requireEventAdmin(c, db, eventId);
  if (auth instanceof Response) return auth;
  if (!auth.newAdminToken) return ok(c, { restored: false });
  return ok(c, { restored: true, adminToken: auth.newAdminToken });
});
