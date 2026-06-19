import { describe, expect, it } from 'vitest';
import type { GameDetail } from '../../api/types';
import { filterAcknowledgedOutbox, reconcileGameWithOutbox } from './reconcile-game';
import type { OutboxItem } from './types';

const baseGame: GameDetail = {
  game: {
    id: 'g1',
    eventId: 'e1',
    teamAId: 'a',
    teamBId: 'b',
    status: 'PLAYING',
    startedAt: 1,
    finishedAt: null,
    plannedDurationMs: 900_000,
    pausedDurationMs: 0,
    pauseStartedAt: null,
    version: 1,
  },
  teamA: undefined,
  teamB: undefined,
  events: [
    {
      id: 'srv-1',
      clientEventId: 'client-1',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: 'p1',
      assistantRosterId: null,
      undoTargetEventId: null,
      serverTs: 100,
    },
  ],
  scoreA: 1,
  scoreB: 0,
  timer: {
    status: 'PLAYING',
    elapsedMs: 0,
    remainingMs: 900_000,
    plannedDurationMs: 900_000,
  },
  eventShortCode: null,
};

function pendingGoal(clientEventId: string): OutboxItem {
  return {
    id: 'out-1',
    gameId: 'g1',
    eventId: 'e1',
    payload: {
      clientEventId,
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: 'p1',
    },
    clientTs: 200,
    status: 'PENDING',
    retryCount: 0,
  };
}

describe('reconcile-game', () => {
  it('drops pending rows already on server', () => {
    const filtered = filterAcknowledgedOutbox(baseGame.events, [pendingGoal('client-1')]);
    expect(filtered).toHaveLength(0);
  });

  it('keeps pending rows not yet on server', () => {
    const merged = reconcileGameWithOutbox(baseGame, [pendingGoal('client-2')]);
    expect(merged.scoreA).toBe(2);
    expect(merged.events).toHaveLength(2);
  });
});
