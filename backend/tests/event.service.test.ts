import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { events } from '../src/db/schema.js';
import { createEvent, generateUniqueShortCode } from '../src/services/event.service.js';
import { setupTestDb } from './helpers/test-db.js';

describe('event.service', () => {
  it('creates event with unique shortCode and secrets', async () => {
    const { db } = setupTestDb();
    const created = await createEvent(db, '周二夜场');
    expect(created.shortCode).toHaveLength(6);
    expect(created.adminToken.startsWith('tok_')).toBe(true);
    expect(created.pin).toMatch(/^\d{6}$/);

    const rows = await db.select().from(events).where(eq(events.id, created.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.name).toBe('周二夜场');
  });

  it('generates unique short codes', async () => {
    const { db } = setupTestDb();
    const a = await generateUniqueShortCode(db);
    await db.insert(events).values({
      id: 'evt1',
      shortCode: a,
      name: 'A',
      adminTokenHash: 'hash',
      adminPin: '111111',
      status: 'DRAFT',
      createdAt: Date.now(),
    });
    const b = await generateUniqueShortCode(db);
    expect(a).not.toBe(b);
  });
});
