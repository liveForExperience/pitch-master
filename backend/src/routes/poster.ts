import { Hono } from 'hono';
import { getDb } from '../db/client.js';
import { fail } from '../lib/api-response.js';
import { mapServiceError } from '../lib/route-errors.js';
import { NotFoundError } from '../lib/errors.js';
import { renderEventPosterPng, renderGamePosterPng } from '../services/poster.service.js';

export const posterRoute = new Hono();

posterRoute.get('/events/:id/poster.png', async (c) => {
  const db = getDb();
  try {
    const png = await renderEventPosterPng(db, c.req.param('id'));
    return c.body(new Uint8Array(png), 200, {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=60',
    });
  } catch (err) {
    if (err instanceof NotFoundError) return fail(c, 'not_found', err.message, 404);
    if (err instanceof Error && err.message.includes('Missing asset')) {
      return fail(c, 'internal', err.message, 500);
    }
    const mapped = mapServiceError(c, err);
    if (mapped) return mapped;
    throw err;
  }
});

posterRoute.get('/games/:id/poster.png', async (c) => {
  const db = getDb();
  try {
    const png = await renderGamePosterPng(db, c.req.param('id'));
    return c.body(new Uint8Array(png), 200, {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=300',
    });
  } catch (err) {
    if (err instanceof NotFoundError) return fail(c, 'not_found', err.message, 404);
    if (err instanceof Error && err.message.includes('Missing asset')) {
      return fail(c, 'internal', err.message, 500);
    }
    const mapped = mapServiceError(c, err);
    if (mapped) return mapped;
    throw err;
  }
});
