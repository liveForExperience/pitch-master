import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { healthRoute } from './routes/health.js';

export function createApp() {
  const app = new Hono();

  app.use('*', logger());
  app.use('/api/*', cors({ origin: '*' }));

  app.route('/api', healthRoute);

  app.notFound((c) => c.json({ error: 'not_found', path: c.req.path }, 404));

  app.onError((err, c) => {
    console.error('[onError]', err);
    return c.json({ error: 'internal', message: err.message }, 500);
  });

  return app;
}
