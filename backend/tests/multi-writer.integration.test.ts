import { describe, expect, it } from 'vitest';
import { createEvent } from '../src/services/event.service.js';
import {
  addRosterMembers,
  createGame,
  createTeam,
  getGameDetail,
  recordGameEvent,
  startGame,
  undoGameEvent,
} from '../src/services/game-ops.service.js';
import { setupTestDb } from './helpers/test-db.js';

describe('multi-writer event log', () => {
  async function seedPlayingGame() {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '多写者');
    const teamA = await createTeam(db, evt.id, { name: '红' });
    const teamB = await createTeam(db, evt.id, { name: '蓝' });
    const [pA, pB] = await Promise.all([
      addRosterMembers(db, teamA.id, ['甲']),
      addRosterMembers(db, teamB.id, ['乙']),
    ]);
    const game = await createGame(db, evt.id, { teamAId: teamA.id, teamBId: teamB.id });
    await startGame(db, game.id, 0);
    return { db, game, pA: pA[0]!, pB: pB[0]! };
  }

  it('accepts goals from two devices without editor lease', async () => {
    const { db, game, pA, pB } = await seedPlayingGame();
    await recordGameEvent(db, game.id, {
      clientEventId: 'device-a-goal-1',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: pA.id,
      clientTs: 1000,
    });
    await recordGameEvent(db, game.id, {
      clientEventId: 'device-b-goal-1',
      type: 'GOAL',
      teamSide: 'B',
      scorerRosterId: pB.id,
      clientTs: 1001,
    });
    const detail = await getGameDetail(db, game.id);
    expect(detail.scoreA).toBe(1);
    expect(detail.scoreB).toBe(1);
    expect(detail.events).toHaveLength(2);
    expect(detail.events[0]!.clientEventId).toBe('device-a-goal-1');
    expect(detail.events[1]!.clientEventId).toBe('device-b-goal-1');
  });

  it('returns events in serverTs order', async () => {
    const { db, game, pA } = await seedPlayingGame();
    await recordGameEvent(db, game.id, {
      clientEventId: 'first-goal',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: pA.id,
      clientTs: 1000,
    });
    await recordGameEvent(db, game.id, {
      clientEventId: 'second-goal',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: pA.id,
      clientTs: 2000,
    });
    const detail = await getGameDetail(db, game.id);
    expect(detail.events.map((e) => e.clientEventId)).toEqual(['first-goal', 'second-goal']);
  });

  it('allows cross-device undo on confirmed server events', async () => {
    const { db, game, pA } = await seedPlayingGame();
    const goal = await recordGameEvent(db, game.id, {
      clientEventId: 'goal-to-undo',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: pA.id,
      clientTs: 1000,
    });
    const undone = await undoGameEvent(db, game.id, goal.event.id, {
      clientEventId: 'undo-from-other-device',
      clientTs: 1001,
    });
    expect(undone.scoreA).toBe(0);
    const detail = await getGameDetail(db, game.id);
    expect(detail.scoreA).toBe(0);
  });

  it('bumps version on timer mutations', async () => {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '版本');
    const teamA = await createTeam(db, evt.id, { name: '红' });
    const teamB = await createTeam(db, evt.id, { name: '蓝' });
    const game = await createGame(db, evt.id, { teamAId: teamA.id, teamBId: teamB.id });
    await startGame(db, game.id, 0);
    const afterStart = await getGameDetail(db, game.id);
    expect(afterStart.game.version).toBe(1);
  });
});
