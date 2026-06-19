import { describe, expect, it } from 'vitest';
import { isFlushable, toBatchPayload } from './flush';
import type { OutboxItem } from './types';

function item(overrides: Partial<OutboxItem>): OutboxItem {
  return {
    id: '1',
    gameId: 'g1',
    eventId: 'e1',
    payload: { clientEventId: 'c1', type: 'GOAL', teamSide: 'A' },
    clientTs: 100,
    status: 'PENDING',
    retryCount: 0,
    ...overrides,
  };
}

describe('outbox flush helpers', () => {
  it('isFlushable allows PENDING and retriable FAILED', () => {
    expect(isFlushable(item({ status: 'PENDING' }))).toBe(true);
    expect(isFlushable(item({ status: 'FAILED', retryCount: 4 }))).toBe(true);
    expect(isFlushable(item({ status: 'FAILED', retryCount: 5 }))).toBe(false);
    expect(isFlushable(item({ status: 'SENDING' }))).toBe(false);
  });

  it('toBatchPayload maps outbox items sorted by clientTs', () => {
    const batch = toBatchPayload([
      item({ clientTs: 200, payload: { clientEventId: 'b', type: 'GOAL', teamSide: 'B' } }),
      item({ clientTs: 100, payload: { clientEventId: 'a', type: 'GOAL', teamSide: 'A' } }),
    ]);
    expect(batch.map((e) => e.clientEventId)).toEqual(['a', 'b']);
    expect(batch[0]).toMatchObject({ clientTs: 100, type: 'GOAL' });
  });
});
