import { describe, expect, it } from 'vitest';
import {
  AuthError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../src/lib/errors.js';
import { createEvent, resolveEventAdmin } from '../src/services/event.service.js';
import {
  createGame,
  createTeam,
  addRosterMembers,
  finishGame,
  getEventByShortCode,
  getGameState,
  recordGameEvent,
  startGame,
  undoGameEvent,
} from '../src/services/game-ops.service.js';
import { setupTestDb } from './helpers/test-db.js';

describe('event.service auth', () => {
  it('accepts valid bearer token', async () => {
    const { db } = setupTestDb();
    const created = await createEvent(db, '鉴权测试');
    const result = await resolveEventAdmin(db, created.id, { bearerToken: created.adminToken });
    expect(result.eventId).toBe(created.id);
    expect(result.newAdminToken).toBeUndefined();
  });

  it('rejects invalid bearer token', async () => {
    const { db } = setupTestDb();
    const created = await createEvent(db, '鉴权测试');
    await expect(
      resolveEventAdmin(db, created.id, { bearerToken: 'tok_bad' }),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it('issues new admin token when pin matches', async () => {
    const { db } = setupTestDb();
    const created = await createEvent(db, '鉴权测试');
    const result = await resolveEventAdmin(db, created.id, { pin: created.pin });
    expect(result.newAdminToken).toMatch(/^tok_/);
  });

  it('rejects invalid pin', async () => {
    const { db } = setupTestDb();
    const created = await createEvent(db, '鉴权测试');
    await expect(resolveEventAdmin(db, created.id, { pin: '000000' })).rejects.toBeInstanceOf(
      AuthError,
    );
  });
});

describe('game-ops guards', () => {
  async function seed() {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '守卫测试');
    const teamA = await createTeam(db, evt.id, { name: '红' });
    const teamB = await createTeam(db, evt.id, { name: '蓝' });
    const [pA] = await addRosterMembers(db, teamA.id, ['甲']);
    const game = await createGame(db, evt.id, { teamAId: teamA.id, teamBId: teamB.id });
    return { db, game, pA: pA!, evt };
  }

  it('looks up event by short code case-insensitively', async () => {
    const { db, evt } = await seed();
    const found = await getEventByShortCode(db, evt.shortCode.toLowerCase());
    expect(found.id).toBe(evt.id);
  });

  it('throws when short code missing', async () => {
    const { db } = setupTestDb();
    await expect(getEventByShortCode(db, 'ZZZZZZ')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('includes derived scores in event games list', async () => {
    const { db, game, pA, evt } = await seed();
    await startGame(db, game.id);
    await recordGameEvent(db, game.id, {
      clientEventId: 'g-list',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: pA.id,
      clientTs: Date.now(),
    });
    const found = await getEventByShortCode(db, evt.shortCode);
    expect(found.games).toHaveLength(1);
    expect(found.games[0]).toMatchObject({ id: game.id, scoreA: 1, scoreB: 0 });
  });

  it('rejects recording before start', async () => {
    const { db, game, pA } = await seed();
    await expect(
      recordGameEvent(db, game.id, {
        clientEventId: 'x',
        type: 'GOAL',
        teamSide: 'A',
        scorerRosterId: pA.id,
        clientTs: Date.now(),
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects undo before start', async () => {
    const { db, game } = await seed();
    await expect(undoGameEvent(db, game.id, 'missing')).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects duplicate team game', async () => {
    const { db, evt, game } = await seed();
    await expect(
      createGame(db, evt.id, { teamAId: game.teamAId, teamBId: game.teamAId }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('is idempotent when undoing same target twice', async () => {
    const { db, game, pA } = await seed();
    await startGame(db, game.id);
    const goal = await recordGameEvent(db, game.id, {
      clientEventId: 'g1',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: pA.id,
      clientTs: Date.now(),
    });
    await undoGameEvent(db, game.id, goal.event.id);
    await undoGameEvent(db, game.id, goal.event.id);
    const state = await getGameState(db, game.id);
    expect(state.scoreA).toBe(0);
  });

  it('finishes from paused and freezes score', async () => {
    const { db, game, pA } = await seed();
    await startGame(db, game.id);
    await recordGameEvent(db, game.id, {
      clientEventId: 'g1',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: pA.id,
      clientTs: Date.now(),
    });
    await finishGame(db, game.id);
    const state = await getGameState(db, game.id);
    expect(state.status).toBe('FINISHED');
    expect(state.scoreA).toBe(1);
  });
});
