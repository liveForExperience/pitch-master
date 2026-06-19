import { describe, expect, it } from 'vitest';
import { createEvent } from '../src/services/event.service.js';
import {
  addRosterMembers,
  createGame,
  createTeam,
  finishGame,
  getGameState,
  recordGameEvent,
  startGame,
} from '../src/services/game-ops.service.js';
import {
  replayGameEventsBatch,
  sortBatchEvents,
} from '../src/services/outbox.service.js';
import { setupTestDb } from './helpers/test-db.js';

describe('outbox.service batch replay', () => {
  async function seedPlayingGame() {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '离线测试');
    const teamA = await createTeam(db, evt.id, { name: '红队' });
    const teamB = await createTeam(db, evt.id, { name: '蓝队' });
    const [pA] = await addRosterMembers(db, teamA.id, ['张三']);
    const [pB] = await addRosterMembers(db, teamB.id, ['李四']);
    const game = await createGame(db, evt.id, { teamAId: teamA.id, teamBId: teamB.id });
    await startGame(db, game.id);
    return { db, game, pA: pA!, pB: pB! };
  }

  it('sorts by clientTs then clientEventId', () => {
    const sorted = sortBatchEvents([
      { clientEventId: 'b', type: 'GOAL', teamSide: 'A', clientTs: 200 },
      { clientEventId: 'a', type: 'GOAL', teamSide: 'B', clientTs: 100 },
      { clientEventId: 'c', type: 'GOAL', teamSide: 'A', clientTs: 100 },
    ]);
    expect(sorted.map((e) => e.clientEventId)).toEqual(['a', 'c', 'b']);
  });

  it('replays goals in clientTs order', async () => {
    const { db, game, pA, pB } = await seedPlayingGame();
    const result = await replayGameEventsBatch(db, game.id, [
      {
        clientEventId: 'g1',
        type: 'GOAL',
        teamSide: 'A',
        scorerRosterId: pA.id,
        clientTs: 100,
      },
      {
        clientEventId: 'g2',
        type: 'GOAL',
        teamSide: 'B',
        scorerRosterId: pB.id,
        clientTs: 200,
      },
      {
        clientEventId: 'g3',
        type: 'GOAL',
        teamSide: 'A',
        scorerRosterId: pA.id,
        clientTs: 300,
      },
    ]);
    expect(result).toMatchObject({ scoreA: 2, scoreB: 1, applied: 3 });
    const state = await getGameState(db, game.id);
    expect(state.scoreA).toBe(2);
    expect(state.scoreB).toBe(1);
  });

  it('resolves undo of offline goal via undoTargetClientEventId', async () => {
    const { db, game, pA } = await seedPlayingGame();
    await replayGameEventsBatch(db, game.id, [
      {
        clientEventId: 'g1',
        type: 'GOAL',
        teamSide: 'A',
        scorerRosterId: pA.id,
        clientTs: 100,
      },
      {
        clientEventId: 'u1',
        type: 'UNDO',
        undoTargetClientEventId: 'g1',
        clientTs: 200,
      },
    ]);
    const state = await getGameState(db, game.id);
    expect(state.scoreA).toBe(0);
  });

  it('is idempotent when the same batch is submitted twice', async () => {
    const { db, game, pA } = await seedPlayingGame();
    const batch = [
      {
        clientEventId: 'g1',
        type: 'GOAL' as const,
        teamSide: 'A' as const,
        scorerRosterId: pA.id,
        clientTs: 100,
      },
    ];
    const first = await replayGameEventsBatch(db, game.id, batch);
    const second = await replayGameEventsBatch(db, game.id, batch);
    expect(first.idempotentHits).toBe(0);
    expect(second.idempotentHits).toBe(1);
    const state = await getGameState(db, game.id);
    expect(state.scoreA).toBe(1);
  });

  it('supports undo of synced event by server id in batch', async () => {
    const { db, game, pA } = await seedPlayingGame();
    const goal = await recordGameEvent(db, game.id, {
      clientEventId: 'online-g1',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: pA.id,
      clientTs: 50,
    });
    await replayGameEventsBatch(db, game.id, [
      {
        clientEventId: 'u-online',
        type: 'UNDO',
        undoTargetEventId: goal.event.id,
        clientTs: 100,
      },
    ]);
    const state = await getGameState(db, game.id);
    expect(state.scoreA).toBe(0);
  });

  it('allows batch after game finished (post-match correction)', async () => {
    const { db, game, pA } = await seedPlayingGame();
    await finishGame(db, game.id);
    await replayGameEventsBatch(db, game.id, [
      {
        clientEventId: 'late-g1',
        type: 'GOAL',
        teamSide: 'A',
        scorerRosterId: pA.id,
        clientTs: 500,
      },
    ]);
    const state = await getGameState(db, game.id);
    expect(state.scoreA).toBe(1);
  });
});
