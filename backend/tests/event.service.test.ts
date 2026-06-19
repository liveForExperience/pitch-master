import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { events } from '../src/db/schema.js';
import {
  createGame,
  createTeam,
  finishGame,
  startGame,
} from '../src/services/game-ops.service.js';
import { ConflictError } from '../src/lib/errors.js';
import { createEvent, finishEvent, generateUniqueShortCode } from '../src/services/event.service.js';
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

  it('finishEvent marks event FINISHED on manual action', async () => {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '手动结束');
    const result = await finishEvent(db, evt.id);
    expect(result.finishedAt).toBeGreaterThan(0);

    const [row] = await db.select().from(events).where(eq(events.id, evt.id));
    expect(row!.status).toBe('FINISHED');
    expect(row!.finishedAt).not.toBeNull();
  });

  it('finishEvent rejects already finished event', async () => {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '重复结束');
    await finishEvent(db, evt.id);
    await expect(finishEvent(db, evt.id)).rejects.toBeInstanceOf(ConflictError);
  });

  it('finishGame does not auto-finish parent event', async () => {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '场次结束');
    const teamA = await createTeam(db, evt.id, { name: 'A' });
    const teamB = await createTeam(db, evt.id, { name: 'B' });
    const game = await createGame(db, evt.id, { teamAId: teamA.id, teamBId: teamB.id });

    await startGame(db, game.id);
    await finishGame(db, game.id);

    const [row] = await db.select().from(events).where(eq(events.id, evt.id));
    expect(row!.status).toBe('DRAFT');
  });
});
