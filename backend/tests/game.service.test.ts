import { describe, expect, it } from 'vitest';
import { deriveScore } from '../src/services/game.service.js';

describe('deriveScore', () => {
  it('counts goals per side', () => {
    const score = deriveScore([
      { id: '1', type: 'GOAL', teamSide: 'A', undoTargetEventId: null },
      { id: '2', type: 'GOAL', teamSide: 'B', undoTargetEventId: null },
      { id: '3', type: 'GOAL', teamSide: 'A', undoTargetEventId: null },
    ]);
    expect(score).toEqual({ scoreA: 2, scoreB: 1 });
  });

  it('handles own goals', () => {
    const score = deriveScore([
      { id: '1', type: 'OWN_GOAL', teamSide: 'A', undoTargetEventId: null },
    ]);
    expect(score).toEqual({ scoreA: 0, scoreB: 1 });
  });

  it('ignores undone events', () => {
    const score = deriveScore([
      { id: '1', type: 'GOAL', teamSide: 'A', undoTargetEventId: null },
      { id: '2', type: 'UNDO', teamSide: null, undoTargetEventId: '1' },
    ]);
    expect(score).toEqual({ scoreA: 0, scoreB: 0 });
  });
});
