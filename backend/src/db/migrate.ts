import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { AppDb } from './client.js';

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'migrations',
);

export function runMigrations(db: AppDb, sqlite: Database.Database): void {
  if (!fs.existsSync(migrationsFolder)) {
    throw new Error(`Migrations folder not found: ${migrationsFolder}`);
  }
  migrate(db, { migrationsFolder });
  sqlite.pragma('journal_mode = WAL');
}
