import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { healthRoute } from './routes/health.js';
import { timeRoute } from './routes/time.js';
import { eventsRoute } from './routes/events.js';
import { teamsRoute } from './routes/teams.js';
import { gamesRoute } from './routes/games.js';
import { streamRoute } from './routes/stream.js';
import { fail } from './lib/api-response.js';

export function createApp() {
  const app = new Hono();

  app.use('*', logger());
  app.use('/api/*', cors({ origin: '*', exposeHeaders: ['X-New-Admin-Token'] }));

  app.route('/api', healthRoute);
  app.route('/api', timeRoute);
  app.route('/api', eventsRoute);
  app.route('/api', teamsRoute);
  app.route('/api', gamesRoute);
  app.route('/api', streamRoute);

  app.notFound((c) => fail(c, 'not_found', `Route not found: ${c.req.path}`, 404));

  app.onError((err, c) => {
    console.error('[onError]', err);
    return fail(c, 'internal', err.message, 500);
  });

  return app;
}
