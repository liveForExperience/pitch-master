import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { createDbConnection, resolveDbFile } from './db/client.js';
import { runMigrations } from './db/migrate.js';

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

const dbFile = resolveDbFile();
const { db, sqlite } = createDbConnection(dbFile);
runMigrations(db, sqlite);
console.log(`[pitchmaster-backend] database ready at ${dbFile}`);

const app = createApp();

serve(
  { fetch: app.fetch, port, hostname: host },
  ({ address, port: actualPort }) => {
    console.log(`[pitchmaster-backend] listening on http://${address}:${actualPort}`);
  },
);

const shutdown = (signal: string) => {
  console.log(`[pitchmaster-backend] received ${signal}, exiting...`);
  sqlite.close();
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
