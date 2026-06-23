import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { ulid } from 'ulid';
import type { AppDb } from './client.js';

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'migrations',
);

type OrphanRoster = { id: string; name: string; created_at: number };

function backfillPersons(sqlite: Database.Database): void {
  const orphans = sqlite
    .prepare(`SELECT id, name, created_at FROM roster WHERE person_id IS NULL`)
    .all() as OrphanRoster[];

  if (orphans.length === 0) return;

  const insertPerson = sqlite.prepare(
    `INSERT INTO person (id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?)`,
  );
  const updateRoster = sqlite.prepare(`UPDATE roster SET person_id = ? WHERE id = ?`);

  const tx = sqlite.transaction(() => {
    for (const row of orphans) {
      const personId = ulid();
      const ts = row.created_at;
      insertPerson.run(personId, row.name, ts, ts);
      updateRoster.run(personId, row.id);
    }
  });
  tx();
}

export function runMigrations(db: AppDb, sqlite: Database.Database): void {
  if (!fs.existsSync(migrationsFolder)) {
    throw new Error(`Migrations folder not found: ${migrationsFolder}`);
  }
  migrate(db, { migrationsFolder });
  backfillPersons(sqlite);
  sqlite.pragma('journal_mode = WAL');
}
