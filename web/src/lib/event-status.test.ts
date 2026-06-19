import { describe, expect, it } from 'vitest';
import { isEventEnded } from './event-status';
import type { EventDetail } from '../api/types';

const baseEvent: EventDetail = {
  id: 'e1',
  shortCode: 'ABC123',
  name: 'Test',
  status: 'DRAFT',
  createdAt: 1,
  finishedAt: null,
  teams: [],
  games: [],
};

describe('isEventEnded', () => {
  it('returns false for draft event', () => {
    expect(isEventEnded(baseEvent)).toBe(false);
  });

  it('returns true only when event status is FINISHED', () => {
    expect(isEventEnded({ ...baseEvent, status: 'FINISHED' })).toBe(true);
  });

  it('returns false when all games finished but event not manually ended', () => {
    expect(
      isEventEnded({
        ...baseEvent,
        games: [
          {
            id: 'g1',
            teamAId: 'a',
            teamBId: 'b',
            status: 'FINISHED',
            startedAt: 1,
            finishedAt: 2,
            plannedDurationMs: 60_000,
          },
        ],
      }),
    ).toBe(false);
  });
});
