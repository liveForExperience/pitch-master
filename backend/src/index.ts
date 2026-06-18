import { serve } from '@hono/node-server';
import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

const app = createApp();

serve(
  { fetch: app.fetch, port, hostname: host },
  ({ address, port: actualPort }) => {
    console.log(`[pitchmaster-backend] listening on http://${address}:${actualPort}`);
  },
);

const shutdown = (signal: string) => {
  console.log(`[pitchmaster-backend] received ${signal}, exiting...`);
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
