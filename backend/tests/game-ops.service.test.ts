import { describe, expect, it } from 'vitest';
import { createEvent } from '../src/services/event.service.js';
import {
  createGame,
  createTeam,
  addRosterMembers,
  startGame,
  recordGameEvent,
  undoGameEvent,
  pauseGame,
  resumeGame,
  finishGame,
  getGameState,
} from '../src/services/game-ops.service.js';
import { setupTestDb } from './helpers/test-db.js';

describe('game-ops.service integration', () => {
  async function seedMatch() {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '测试活动');
    const teamA = await createTeam(db, evt.id, { name: '红队' });
    const teamB = await createTeam(db, evt.id, { name: '蓝队' });
    const [pA] = await addRosterMembers(db, teamA.id, ['张三']);
    const game = await createGame(db, evt.id, { teamAId: teamA.id, teamBId: teamB.id });
    return { db, game, pA: pA!, evt };
  }

  it('runs start → goal → undo → finish flow', async () => {
    const { db, game, pA } = await seedMatch();
    await startGame(db, game.id);

    const goal = await recordGameEvent(db, game.id, {
      clientEventId: 'g1',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: pA.id,
      clientTs: Date.now(),
    });
    expect(goal.scoreA).toBe(1);
    expect(goal.scoreB).toBe(0);

    await undoGameEvent(db, game.id, goal.event.id);
    const afterUndo = await getGameState(db, game.id);
    expect(afterUndo.scoreA).toBe(0);

    await recordGameEvent(db, game.id, {
      clientEventId: 'g2',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: pA.id,
      clientTs: Date.now(),
    });
    await finishGame(db, game.id);
    const finalState = await getGameState(db, game.id);
    expect(finalState.status).toBe('FINISHED');
    expect(finalState.scoreA).toBe(1);
  });

  it('handles pause and resume', async () => {
    const { db, game } = await seedMatch();
    await startGame(db, game.id);
    await pauseGame(db, game.id);
    let state = await getGameState(db, game.id);
    expect(state.status).toBe('PAUSED');

    await resumeGame(db, game.id);
    state = await getGameState(db, game.id);
    expect(state.status).toBe('PLAYING');
  });

  it('can undo a specific non-last goal', async () => {
    const { db, game, pA } = await seedMatch();
    await startGame(db, game.id);
    const first = await recordGameEvent(db, game.id, {
      clientEventId: 'g-first',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: pA.id,
      clientTs: Date.now(),
    });
    await recordGameEvent(db, game.id, {
      clientEventId: 'g-second',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: pA.id,
      clientTs: Date.now(),
    });

    await undoGameEvent(db, game.id, first.event.id);
    const state = await getGameState(db, game.id);
    expect(state.scoreA).toBe(1);
  });

  it('allows post-finish goal correction and undo', async () => {
    const { db, game, pA } = await seedMatch();
    await startGame(db, game.id);
    await recordGameEvent(db, game.id, {
      clientEventId: 'g1',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: pA.id,
      clientTs: Date.now(),
    });
    await finishGame(db, game.id);

    const supplemental = await recordGameEvent(db, game.id, {
      clientEventId: 'g-post',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: pA.id,
      clientTs: Date.now(),
    });
    let state = await getGameState(db, game.id);
    expect(state.status).toBe('FINISHED');
    expect(state.scoreA).toBe(2);

    await undoGameEvent(db, game.id, supplemental.event.id);
    state = await getGameState(db, game.id);
    expect(state.scoreA).toBe(1);
  });

  it('is idempotent on duplicate clientEventId', async () => {
    const { db, game, pA } = await seedMatch();
    await startGame(db, game.id);
    const payload = {
      clientEventId: 'same-id',
      type: 'GOAL' as const,
      teamSide: 'A' as const,
      scorerRosterId: pA.id,
      clientTs: Date.now(),
    };
    await recordGameEvent(db, game.id, payload);
    const again = await recordGameEvent(db, game.id, payload);
    expect(again.idempotent).toBe(true);
    const state = await getGameState(db, game.id);
    expect(state.scoreA).toBe(1);
  });
});
