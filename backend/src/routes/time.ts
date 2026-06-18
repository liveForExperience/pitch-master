import { Hono } from 'hono';
import { getDb } from '../db/client.js';
import { ok } from '../lib/api-response.js';
import { nowMs } from '../lib/id.js';

export const timeRoute = new Hono().get('/time', (c) =>
  ok(c, { serverNow: nowMs() }),
);

// health stays separate; time route mounted at /api
