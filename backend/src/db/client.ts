import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

export type AppDb = BetterSQLite3Database<typeof schema>;

let singleton: { db: AppDb; sqlite: Database.Database } | null = null;

export function resolveDbFile(): string {
  if (process.env.DB_FILE) return process.env.DB_FILE;
  if (process.env.NODE_ENV === 'production') return '/var/lib/pitchmaster/data.db';
  return path.join(process.cwd(), 'data.db');
}

export function createDbConnection(dbFile = resolveDbFile()): {
  db: AppDb;
  sqlite: Database.Database;
} {
  const dir = path.dirname(dbFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const sqlite = new Database(dbFile);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}

export function bootstrapDb(dbFile = resolveDbFile()): {
  db: AppDb;
  sqlite: Database.Database;
} {
  if (singleton) singleton.sqlite.close();
  singleton = createDbConnection(dbFile);
  return singleton;
}

export function getDb(): AppDb {
  if (!singleton) singleton = createDbConnection();
  return singleton.db;
}

export function getSqlite(): Database.Database {
  if (!singleton) singleton = createDbConnection();
  return singleton.sqlite;
}

/** Test helper: in-memory DB with schema applied. */
export function createTestDb(): { db: AppDb; sqlite: Database.Database } {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}

export function resetDbForTests(): void {
  if (singleton) {
    singleton.sqlite.close();
    singleton = null;
  }
}
