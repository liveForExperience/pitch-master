import { eq } from 'drizzle-orm';
import type { AppDb } from '../db/client.js';
import { events } from '../db/schema.js';
import {
  generateAdminToken,
  generatePin,
  generateShortCode,
  hashAdminToken,
  verifyAdminToken,
} from '../lib/auth-crypto.js';
import { newId, nowMs } from '../lib/id.js';
import { AuthError, ConflictError, NotFoundError } from '../lib/errors.js';

export async function resolveEventAdmin(
  db: AppDb,
  eventId: string,
  opts: { bearerToken?: string; pin?: string },
): Promise<{ eventId: string; newAdminToken?: string }> {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw new AuthError('Event not found');

  if (opts.bearerToken) {
    if (!verifyAdminToken(opts.bearerToken, event.adminPin, event.adminTokenHash)) {
      throw new AuthError('Invalid admin token');
    }
    return { eventId: event.id };
  }

  if (opts.pin) {
    if (opts.pin !== event.adminPin) throw new AuthError('Invalid PIN');
    const newAdminToken = generateAdminToken();
    const adminTokenHash = hashAdminToken(newAdminToken, event.adminPin);
    await db
      .update(events)
      .set({ adminTokenHash })
      .where(eq(events.id, event.id));
    return { eventId: event.id, newAdminToken };
  }

  throw new AuthError('Admin credentials required');
}

export function createEventSecrets() {
  const adminToken = generateAdminToken();
  const pin = generatePin();
  const adminTokenHash = hashAdminToken(adminToken, pin);
  return { adminToken, pin, adminTokenHash };
}

export async function generateUniqueShortCode(db: AppDb, maxAttempts = 8): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const shortCode = generateShortCode();
    const existing = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.shortCode, shortCode))
      .limit(1);
    if (existing.length === 0) return shortCode;
  }
  throw new Error('Failed to generate unique short code');
}

export async function createEvent(db: AppDb, name: string) {
  const id = newId();
  const shortCode = await generateUniqueShortCode(db);
  const { adminToken, pin, adminTokenHash } = createEventSecrets();
  const createdAt = nowMs();

  await db.insert(events).values({
    id,
    shortCode,
    name,
    adminTokenHash,
    adminPin: pin,
    status: 'DRAFT',
    createdAt,
  });

  return { id, shortCode, adminToken, pin, createdAt };
}

/** 管理员手动结束活动（唯一归档触发源） */
export async function finishEvent(db: AppDb, eventId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw new NotFoundError('Event not found');
  if (event.status === 'FINISHED') throw new ConflictError('Event already finished');

  const finishedAt = nowMs();
  await db
    .update(events)
    .set({ status: 'FINISHED', finishedAt })
    .where(eq(events.id, eventId));
  return { eventId, finishedAt };
}

export async function deleteEvent(db: AppDb, eventId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw new NotFoundError('Event not found');
  await db.delete(events).where(eq(events.id, eventId));
  return { eventId, shortCode: event.shortCode };
}
