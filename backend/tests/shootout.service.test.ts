import { describe, expect, it } from 'vitest';
import type { ScoreEvent } from '../src/types/domain.js';
import {
  canEndShootout,
  deriveShootoutState,
  nextKickSide,
} from '../src/services/shootout.service.js';

function kick(
  id: string,
  teamSide: 'A' | 'B',
  made: boolean,
): ScoreEvent {
  return {
    id,
    type: made ? 'PENALTY_MADE' : 'PENALTY_MISSED',
    teamSide,
    undoTargetEventId: null,
  };
}

function undo(id: string, target: string): ScoreEvent {
  return { id, type: 'UNDO', teamSide: null, undoTargetEventId: target };
}

function endEvent(id: string): ScoreEvent {
  return { id, type: 'SHOOTOUT_END', teamSide: null, undoTargetEventId: null };
}

describe('deriveShootoutState', () => {
  it('counts made kicks per side and ignores misses in the tally', () => {
    const state = deriveShootoutState([
      kick('1', 'A', true),
      kick('2', 'B', false),
      kick('3', 'A', true),
      kick('4', 'B', true),
    ]);
    expect(state.madeA).toBe(2);
    expect(state.madeB).toBe(1);
    expect(state.attemptsA).toBe(2);
    expect(state.attemptsB).toBe(2);
  });

  it('ignores non-shootout events (regular goals must not leak in)', () => {
    const state = deriveShootoutState([
      { id: '1', type: 'GOAL', teamSide: 'A', undoTargetEventId: null },
      kick('2', 'A', true),
    ]);
    expect(state.madeA).toBe(1);
    expect(state.attemptsA).toBe(1);
    expect(state.attemptsB).toBe(0);
  });

  it('respects undo on shootout kicks', () => {
    const state = deriveShootoutState([
      kick('1', 'A', true),
      undo('2', '1'),
      kick('3', 'A', false),
    ]);
    expect(state.madeA).toBe(0);
    expect(state.attemptsA).toBe(1);
  });

  it('declares winner by mathematical elimination in regulation phase', () => {
    // A: 3/3, B: 0/3. B can win at most 2 more → best B = 2, still < 3.
    const state = deriveShootoutState([
      kick('a1', 'A', true),
      kick('b1', 'B', false),
      kick('a2', 'A', true),
      kick('b2', 'B', false),
      kick('a3', 'A', true),
      kick('b3', 'B', false),
    ]);
    expect(state.winner).toBe('A');
    expect(state.decided).toBe(true);
  });

  it('is undecided when both sides finish 5-5 level', () => {
    const events: ScoreEvent[] = [];
    for (let i = 0; i < 5; i++) {
      events.push(kick(`a${i}`, 'A', true));
      events.push(kick(`b${i}`, 'B', true));
    }
    const state = deriveShootoutState(events);
    expect(state.attemptsA).toBe(5);
    expect(state.decided).toBe(false);
    expect(state.winner).toBeNull();
  });

  it('sudden-death: decides when attempts are equal and made counts differ', () => {
    const events: ScoreEvent[] = [];
    for (let i = 0; i < 5; i++) {
      events.push(kick(`a${i}`, 'A', true));
      events.push(kick(`b${i}`, 'B', true));
    }
    events.push(kick('a5', 'A', true));
    events.push(kick('b5', 'B', false));
    const state = deriveShootoutState(events);
    expect(state.decided).toBe(true);
    expect(state.winner).toBe('A');
  });

  it('nextKickSide alternates A→B→A while attempts are level or A leads by one', () => {
    let state = deriveShootoutState([]);
    expect(nextKickSide(state)).toBe('A');
    state = deriveShootoutState([kick('1', 'A', true)]);
    expect(nextKickSide(state)).toBe('B');
    state = deriveShootoutState([kick('1', 'A', true), kick('2', 'B', false)]);
    expect(nextKickSide(state)).toBe('A');
  });

  it('nextKickSide returns null once decided', () => {
    const state = deriveShootoutState([
      kick('a1', 'A', true),
      kick('b1', 'B', false),
      kick('a2', 'A', true),
      kick('b2', 'B', false),
      kick('a3', 'A', true),
      kick('b3', 'B', false),
    ]);
    expect(nextKickSide(state)).toBeNull();
  });

  it('firstKicker is derived from the first active kick', () => {
    const state = deriveShootoutState([
      kick('b1', 'B', true),
      kick('a1', 'A', false),
    ]);
    expect(state.firstKicker).toBe('B');
  });

  it('nextKickSide honors first-kicker preference when kicks empty', () => {
    const empty = deriveShootoutState([]);
    expect(nextKickSide(empty, 'A')).toBe('A');
    expect(nextKickSide(empty, 'B')).toBe('B');
  });

  it('nextKickSide follows first-kicker after kicks are recorded', () => {
    // B kicks first — attempts B=1, A=0 → next is A
    let state = deriveShootoutState([kick('b1', 'B', true)]);
    expect(nextKickSide(state)).toBe('A');
    // After B/A equal, next again is B (firstKicker=B)
    state = deriveShootoutState([kick('b1', 'B', true), kick('a1', 'A', false)]);
    expect(nextKickSide(state)).toBe('B');
  });

  it('SHOOTOUT_END sets ended=true and disables nextKick', () => {
    const events: ScoreEvent[] = [];
    for (let i = 0; i < 5; i++) {
      events.push(kick(`a${i}`, 'A', true));
      events.push(kick(`b${i}`, 'B', i < 4));
    }
    // A 5 – B 4, rounds equal, decided.
    let state = deriveShootoutState(events);
    expect(canEndShootout(state)).toBe(true);
    state = deriveShootoutState([...events, endEvent('end1')]);
    expect(state.ended).toBe(true);
    expect(nextKickSide(state)).toBeNull();
    expect(canEndShootout(state)).toBe(false);
  });

  it('SHOOTOUT_END can be UNDO-ed to reopen shootout', () => {
    const events: ScoreEvent[] = [];
    for (let i = 0; i < 5; i++) {
      events.push(kick(`a${i}`, 'A', true));
      events.push(kick(`b${i}`, 'B', i < 4));
    }
    events.push(endEvent('end1'));
    events.push(undo('u1', 'end1'));
    const state = deriveShootoutState(events);
    expect(state.ended).toBe(false);
    expect(state.winner).toBe('A');
  });

  it('canEndShootout requires equal rounds and a decisive lead', () => {
    // Unequal rounds → cannot end.
    let state = deriveShootoutState([
      kick('a1', 'A', true),
      kick('b1', 'B', false),
      kick('a2', 'A', true),
    ]);
    expect(canEndShootout(state)).toBe(false);

    // Equal rounds but still tied (no winner) → cannot end.
    state = deriveShootoutState([
      kick('a1', 'A', true),
      kick('b1', 'B', true),
    ]);
    expect(canEndShootout(state)).toBe(false);

    // Equal rounds AND decisive lead → can end.
    state = deriveShootoutState([
      kick('a1', 'A', true),
      kick('b1', 'B', false),
      kick('a2', 'A', true),
      kick('b2', 'B', false),
      kick('a3', 'A', true),
      kick('b3', 'B', false),
    ]);
    expect(canEndShootout(state)).toBe(true);
  });

  it('canEndShootout allows early stop after 2 equal rounds when leader exists (amateur policy)', () => {
    // Both sides took 2 kicks: A 1/2, B 2/2. Strict FIFA says the shootout
    // is NOT mathematically decided (A can still catch up with 3 remaining),
    // but the amateur admin should still be able to end here if teams agree.
    const state = deriveShootoutState([
      kick('a1', 'A', true),
      kick('b1', 'B', true),
      kick('a2', 'A', false),
      kick('b2', 'B', true),
    ]);
    expect(state.decided).toBe(false); // strict FIFA — still open
    expect(state.winner).toBe('B'); // current leader — broader semantic
    expect(canEndShootout(state)).toBe(true);
  });
});
