import { desc, eq } from 'drizzle-orm';
import type { AppDb } from '../db/client.js';
import { persons, rosters } from '../db/schema.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';
import { newId, nowMs } from '../lib/id.js';

export async function listPersons(db: AppDb) {
  return db.select().from(persons).orderBy(desc(persons.updatedAt));
}

export async function createPerson(db: AppDb, displayName: string) {
  const trimmed = displayName.trim();
  if (!trimmed) throw new ValidationError('displayName is required');
  const id = newId();
  const now = nowMs();
  await db.insert(persons).values({
    id,
    displayName: trimmed,
    createdAt: now,
    updatedAt: now,
  });
  return { id, displayName: trimmed, createdAt: now, updatedAt: now };
}

export async function renamePerson(db: AppDb, personId: string, displayName: string) {
  const trimmed = displayName.trim();
  if (!trimmed) throw new ValidationError('displayName is required');

  const [existing] = await db.select().from(persons).where(eq(persons.id, personId)).limit(1);
  if (!existing) throw new NotFoundError('Person not found');

  const now = nowMs();
  await db
    .update(persons)
    .set({ displayName: trimmed, updatedAt: now })
    .where(eq(persons.id, personId));

  await db.update(rosters).set({ name: trimmed }).where(eq(rosters.personId, personId));

  return { id: personId, displayName: trimmed, updatedAt: now };
}

export async function getPersonById(db: AppDb, personId: string) {
  const [row] = await db.select().from(persons).where(eq(persons.id, personId)).limit(1);
  if (!row) throw new NotFoundError('Person not found');
  return row;
}
