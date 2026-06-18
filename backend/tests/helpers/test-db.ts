import { bootstrapDb, createTestDb } from '../src/db/client.js';
import { runMigrations } from '../src/db/migrate.js';
import { resetSseBrokerForTests } from '../src/lib/sse-broker.js';

export function setupTestDb() {
  resetSseBrokerForTests();
  const { db, sqlite } = createTestDb();
  runMigrations(db, sqlite);
  bootstrapDb(':memory:');
  // bootstrapDb overwrites singleton with new connection - use test db directly
  return { db, sqlite };
}

export function applyMigrationsTo(db: ReturnType<typeof createTestDb>['db'], sqlite: ReturnType<typeof createTestDb>['sqlite']) {
  runMigrations(db, sqlite);
}
