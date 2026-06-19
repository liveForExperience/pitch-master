import { describe, expect, it } from 'vitest';
import { deriveScore, getUndoneEventIds } from '../src/services/game.service.js';

describe('deriveScore semantics', () => {
  it('counts goals per side', () => {
    expect(
      deriveScore([
        { id: '1', type: 'GOAL', teamSide: 'A', undoTargetEventId: null },
        { id: '2', type: 'GOAL', teamSide: 'B', undoTargetEventId: null },
        { id: '3', type: 'GOAL', teamSide: 'A', undoTargetEventId: null },
      ]),
    ).toEqual({ scoreA: 2, scoreB: 1 });
  });

  it('handles own goals as points for opponent', () => {
    expect(
      deriveScore([{ id: '1', type: 'OWN_GOAL', teamSide: 'A', undoTargetEventId: null }]),
    ).toEqual({ scoreA: 0, scoreB: 1 });
  });

  it('ignores undone events regardless of order', () => {
    expect(
      deriveScore([
        { id: '1', type: 'GOAL', teamSide: 'A', undoTargetEventId: null },
        { id: '2', type: 'GOAL', teamSide: 'A', undoTargetEventId: null },
        { id: '3', type: 'UNDO', teamSide: null, undoTargetEventId: '1' },
      ]),
    ).toEqual({ scoreA: 1, scoreB: 0 });
  });

  it('allows undoing middle goal without affecting others', () => {
    expect(
      deriveScore([
        { id: '1', type: 'GOAL', teamSide: 'A', undoTargetEventId: null },
        { id: '2', type: 'GOAL', teamSide: 'A', undoTargetEventId: null },
        { id: '3', type: 'UNDO', teamSide: null, undoTargetEventId: '1' },
        { id: '4', type: 'GOAL', teamSide: 'B', undoTargetEventId: null },
      ]),
    ).toEqual({ scoreA: 1, scoreB: 1 });
  });

  it('double undo reference only applies once', () => {
    const events = [
      { id: '1', type: 'GOAL', teamSide: 'A', undoTargetEventId: null },
      { id: '2', type: 'UNDO', teamSide: null, undoTargetEventId: '1' },
      { id: '3', type: 'UNDO', teamSide: null, undoTargetEventId: '1' },
    ] as const;
    expect(getUndoneEventIds([...events]).has('1')).toBe(true);
    expect(deriveScore([...events])).toEqual({ scoreA: 0, scoreB: 0 });
  });
});
