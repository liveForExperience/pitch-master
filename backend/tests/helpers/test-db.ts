import { createTestDb, resetDbForTests, useDbConnection } from '../../src/db/client.js';
import { runMigrations } from '../../src/db/migrate.js';
import { resetSseBrokerForTests } from '../../src/lib/sse-broker.js';

export function setupTestDb() {
  resetSseBrokerForTests();
  resetDbForTests();
  const conn = createTestDb();
  runMigrations(conn.db, conn.sqlite);
  useDbConnection(conn);
  return conn;
}
