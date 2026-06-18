import { Hono } from 'hono';
import { getDb } from '../db/client.js';
import { requireGameAdmin } from '../lib/admin-auth.js';
import { fail, ok } from '../lib/api-response.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  finishGame,
  getGameDetail,
  getGameState,
  pauseGame,
  recordGameEvent,
  resumeGame,
  startGame,
  undoGameEvent,
} from '../services/game-ops.service.js';

export const gamesRoute = new Hono();

gamesRoute.get('/games/:id', async (c) => {
  const db = getDb();
  try {
    const data = await getGameDetail(db, c.req.param('id'));
    return ok(c, data);
  } catch (err) {
    if (err instanceof NotFoundError) return fail(c, 'not_found', err.message, 404);
    throw err;
  }
});

gamesRoute.get('/games/:id/state', async (c) => {
  const db = getDb();
  try {
    const data = await getGameState(db, c.req.param('id'));
    return ok(c, data);
  } catch (err) {
    if (err instanceof NotFoundError) return fail(c, 'not_found', err.message, 404);
    throw err;
  }
});

gamesRoute.post('/games/:id/start', async (c) => {
  const gameId = c.req.param('id');
  const db = getDb();
  const auth = await requireGameAdmin(c, db, gameId);
  if (auth instanceof Response) return auth;
  try {
    const data = await startGame(db, gameId);
    const res = ok(c, data);
    if (auth.newAdminToken) res.headers.set('X-New-Admin-Token', auth.newAdminToken);
    return res;
  } catch (err) {
    if (err instanceof ConflictError) return fail(c, 'conflict', err.message, 409);
    throw err;
  }
});

gamesRoute.post('/games/:id/pause', async (c) => {
  const gameId = c.req.param('id');
  const db = getDb();
  const auth = await requireGameAdmin(c, db, gameId);
  if (auth instanceof Response) return auth;
  try {
    const data = await pauseGame(db, gameId);
    const res = ok(c, data);
    if (auth.newAdminToken) res.headers.set('X-New-Admin-Token', auth.newAdminToken);
    return res;
  } catch (err) {
    if (err instanceof ConflictError) return fail(c, 'conflict', err.message, 409);
    throw err;
  }
});

gamesRoute.post('/games/:id/resume', async (c) => {
  const gameId = c.req.param('id');
  const db = getDb();
  const auth = await requireGameAdmin(c, db, gameId);
  if (auth instanceof Response) return auth;
  try {
    const data = await resumeGame(db, gameId);
    const res = ok(c, data);
    if (auth.newAdminToken) res.headers.set('X-New-Admin-Token', auth.newAdminToken);
    return res;
  } catch (err) {
    if (err instanceof ConflictError) return fail(c, 'conflict', err.message, 409);
    throw err;
  }
});

gamesRoute.post('/games/:id/finish', async (c) => {
  const gameId = c.req.param('id');
  const db = getDb();
  const auth = await requireGameAdmin(c, db, gameId);
  if (auth instanceof Response) return auth;
  try {
    const data = await finishGame(db, gameId);
    const res = ok(c, data);
    if (auth.newAdminToken) res.headers.set('X-New-Admin-Token', auth.newAdminToken);
    return res;
  } catch (err) {
    if (err instanceof ConflictError) return fail(c, 'conflict', err.message, 409);
    throw err;
  }
});

gamesRoute.post('/games/:id/events', async (c) => {
  const gameId = c.req.param('id');
  const db = getDb();
  const auth = await requireGameAdmin(c, db, gameId);
  if (auth instanceof Response) return auth;

  const body = await c.req
    .json<{
      clientEventId?: string;
      type?: 'GOAL' | 'OWN_GOAL' | 'ASSIST';
      teamSide?: 'A' | 'B';
      scorerRosterId?: string;
      assistantRosterId?: string;
      clientTs?: number;
    }>()
    .catch(() => ({}));

  if (!body.clientEventId || !body.type || body.clientTs == null) {
    return fail(c, 'validation_error', 'clientEventId, type, clientTs required', 400);
  }

  try {
    const data = await recordGameEvent(db, gameId, {
      clientEventId: body.clientEventId,
      type: body.type,
      teamSide: body.teamSide,
      scorerRosterId: body.scorerRosterId,
      assistantRosterId: body.assistantRosterId,
      clientTs: body.clientTs,
    });
    const res = ok(c, data, 201);
    if (auth.newAdminToken) res.headers.set('X-New-Admin-Token', auth.newAdminToken);
    return res;
  } catch (err) {
    if (err instanceof NotFoundError) return fail(c, 'not_found', err.message, 404);
    if (err instanceof ConflictError) return fail(c, 'conflict', err.message, 409);
    if (err instanceof ValidationError) return fail(c, 'validation_error', err.message, 400);
    throw err;
  }
});

gamesRoute.delete('/games/:id/events/:eventId', async (c) => {
  const gameId = c.req.param('id');
  const eventId = c.req.param('eventId');
  const db = getDb();
  const auth = await requireGameAdmin(c, db, gameId);
  if (auth instanceof Response) return auth;

  try {
    const data = await undoGameEvent(db, gameId, eventId);
    const res = ok(c, data);
    if (auth.newAdminToken) res.headers.set('X-New-Admin-Token', auth.newAdminToken);
    return res;
  } catch (err) {
    if (err instanceof NotFoundError) return fail(c, 'not_found', err.message, 404);
    if (err instanceof ConflictError) return fail(c, 'conflict', err.message, 409);
    if (err instanceof ValidationError) return fail(c, 'validation_error', err.message, 400);
    throw err;
  }
});
