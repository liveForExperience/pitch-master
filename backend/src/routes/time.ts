import { Hono } from 'hono';
import { ok } from '../lib/api-response.js';
import { nowMs } from '../lib/id.js';

export const timeRoute = new Hono().get('/time', (c) => ok(c, { serverNow: nowMs() }));
