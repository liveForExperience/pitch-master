import { describe, expect, it } from 'vitest';
import {
  deriveScore,
  groupOutboxByGameId,
  mergeGameWithOutbox,
  resolveUndoTarget,
  sortOutboxItems,
} from './merge-game';
import type { OutboxItem } from './types';
import type { GameDetail } from '../../api/types';

const baseGame: GameDetail = {
  game: {
    id: 'g1',
    eventId: 'e1',
    teamAId: 't1',
    teamBId: 't2',
    status: 'PLAYING',
    startedAt: 1,
    finishedAt: null,
    plannedDurationMs: 1_800_000,
    pausedDurationMs: 0,
    pauseStartedAt: null,
    version: 0,
  },
  teamA: { id: 't1', name: '红', colorHex: '#f00', roster: [] },
  teamB: { id: 't2', name: '蓝', colorHex: '#00f', roster: [] },
  events: [
    {
      id: 'srv-g1',
      clientEventId: 'srv-g1-client',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: 'p1',
      assistantRosterId: null,
      undoTargetEventId: null,
      serverTs: 10,
    },
  ],
  scoreA: 1,
  scoreB: 0,
  timer: {
    status: 'PLAYING',
    elapsedMs: 0,
    remainingMs: 1_800_000,
    plannedDurationMs: 1_800_000,
  },
  eventShortCode: 'ABC123',
};

function makeItem(
  overrides: Partial<OutboxItem> & Pick<OutboxItem, 'payload' | 'clientTs'>,
): OutboxItem {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    gameId: overrides.gameId ?? 'g1',
    eventId: overrides.eventId ?? 'e1',
    status: overrides.status ?? 'PENDING',
    retryCount: overrides.retryCount ?? 0,
    ...overrides,
  };
}

describe('outbox merge-game', () => {
  it('sorts outbox items by clientTs then id', () => {
    const sorted = sortOutboxItems([
      makeItem({ id: 'b', clientTs: 200, payload: { clientEventId: 'x', type: 'GOAL', teamSide: 'A' } }),
      makeItem({ id: 'a', clientTs: 100, payload: { clientEventId: 'y', type: 'GOAL', teamSide: 'B' } }),
      makeItem({ id: 'c', clientTs: 100, payload: { clientEventId: 'z', type: 'GOAL', teamSide: 'A' } }),
    ]);
    expect(sorted.map((i) => i.id)).toEqual(['a', 'c', 'b']);
  });

  it('groups items by gameId', () => {
    const groups = groupOutboxByGameId([
      makeItem({ gameId: 'g2', clientTs: 1, payload: { clientEventId: 'a', type: 'GOAL', teamSide: 'A' } }),
      makeItem({ gameId: 'g1', clientTs: 2, payload: { clientEventId: 'b', type: 'GOAL', teamSide: 'B' } }),
      makeItem({ gameId: 'g1', clientTs: 3, payload: { clientEventId: 'c', type: 'GOAL', teamSide: 'A' } }),
    ]);
    expect([...groups.keys()].sort()).toEqual(['g1', 'g2']);
    expect(groups.get('g1')!.map((i) => i.payload.clientEventId)).toEqual(['b', 'c']);
  });

  it('merges pending goals into score optimistically', () => {
    const merged = mergeGameWithOutbox(baseGame, [
      makeItem({
        clientTs: 20,
        payload: {
          clientEventId: 'off-g1',
          type: 'GOAL',
          teamSide: 'B',
          scorerRosterId: 'p2',
        },
      }),
    ]);
    expect(merged.scoreA).toBe(1);
    expect(merged.scoreB).toBe(1);
    expect(merged.events.some((e) => e.id === 'off-g1')).toBe(true);
  });

  it('applies offline undo via clientEventId', () => {
    const merged = mergeGameWithOutbox(baseGame, [
      makeItem({
        clientTs: 30,
        payload: {
          clientEventId: 'off-u1',
          type: 'UNDO',
          undoTargetEventId: 'srv-g1',
        },
      }),
    ]);
    expect(merged.scoreA).toBe(0);
    expect(merged.scoreB).toBe(0);
  });

  it('deriveScore matches server semantics', () => {
    const score = deriveScore([
      {
        id: 'g1',
        clientEventId: 'c-g1',
        type: 'GOAL',
        teamSide: 'A',
        scorerRosterId: null,
        assistantRosterId: null,
        undoTargetEventId: null,
        serverTs: 1,
      },
      {
        id: 'g2',
        clientEventId: 'c-g2',
        type: 'GOAL',
        teamSide: 'B',
        scorerRosterId: null,
        assistantRosterId: null,
        undoTargetEventId: null,
        serverTs: 2,
      },
      {
        id: 'u1',
        clientEventId: 'c-u1',
        type: 'UNDO',
        teamSide: null,
        scorerRosterId: null,
        assistantRosterId: null,
        undoTargetEventId: 'g1',
        serverTs: 3,
      },
    ]);
    expect(score).toEqual({ scoreA: 0, scoreB: 1 });
  });

  it('resolveUndoTarget prefers server id when present', () => {
    expect(
      resolveUndoTarget('srv-g1', baseGame.events, []),
    ).toEqual({ undoTargetEventId: 'srv-g1' });
  });

  it('resolveUndoTarget uses client id for pending goals', () => {
    const pending = [
      makeItem({
        payload: { clientEventId: 'off-g1', type: 'GOAL', teamSide: 'A', scorerRosterId: 'p1' },
        clientTs: 5,
      }),
    ];
    expect(resolveUndoTarget('off-g1', baseGame.events, pending)).toEqual({
      undoTargetClientEventId: 'off-g1',
    });
  });
});
