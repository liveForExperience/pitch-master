import { describe, expect, it } from 'vitest';
import { buildGameRecordHref } from './game-routes';

describe('game-routes', () => {
  it('buildGameRecordHref carries shortCode and eventId for admin session', () => {
    expect(buildGameRecordHref('g1', { shortCode: 'ABC123', eventId: 'evt-1' })).toBe(
      '/games/g1/record?shortCode=ABC123&eventId=evt-1',
    );
  });
});
