import type { ScoreEvent } from '../types/domain.js';
import { getUndoneEventIds } from './game.service.js';

export type ShootoutState = {
  /** Ordered active kicks (undone excluded), oldest first. */
  kicks: Array<{
    id: string;
    teamSide: 'A' | 'B';
    made: boolean;
  }>;
  madeA: number;
  madeB: number;
  attemptsA: number;
  attemptsB: number;
  /** Which side took the first kick (derived from kicks[0]); null if empty. */
  firstKicker: 'A' | 'B' | null;
  /** 'A' | 'B' | null (still level or nothing recorded) */
  winner: 'A' | 'B' | null;
  /** True once one side is mathematically ahead with no kicks to come. */
  decided: boolean;
  /**
   * True once the admin has committed a `SHOOTOUT_END` event that is still
   * active (not UNDO'd). When ended, the UI must hide the kick recorder.
   */
  ended: boolean;
};

type ShootoutEvent = ScoreEvent;

const REGULATION_KICKS_PER_SIDE = 5;

/**
 * Derive the current shootout state from a game's event stream. Only
 * PENALTY_MADE / PENALTY_MISSED / SHOOTOUT_END events (not UNDO'd) are
 * considered; regular GOAL/OWN_GOAL are ignored — regular time score is
 * never affected by a shootout.
 */
export function deriveShootoutState(events: ShootoutEvent[]): ShootoutState {
  const undone = getUndoneEventIds(events);
  const kicks: ShootoutState['kicks'] = [];
  let ended = false;

  for (const e of events) {
    if (undone.has(e.id)) continue;
    if (e.type === 'SHOOTOUT_END') {
      ended = true;
      continue;
    }
    if (e.type !== 'PENALTY_MADE' && e.type !== 'PENALTY_MISSED') continue;
    if (e.teamSide !== 'A' && e.teamSide !== 'B') continue;
    kicks.push({ id: e.id, teamSide: e.teamSide, made: e.type === 'PENALTY_MADE' });
  }

  let madeA = 0;
  let madeB = 0;
  let attemptsA = 0;
  let attemptsB = 0;
  for (const k of kicks) {
    if (k.teamSide === 'A') {
      attemptsA++;
      if (k.made) madeA++;
    } else {
      attemptsB++;
      if (k.made) madeB++;
    }
  }

  const firstKicker: 'A' | 'B' | null = kicks[0]?.teamSide ?? null;
  const { winner, decided } = decideWinner({ madeA, madeB, attemptsA, attemptsB });

  return {
    kicks,
    madeA,
    madeB,
    attemptsA,
    attemptsB,
    firstKicker,
    winner,
    decided,
    ended,
  };
}

/**
 * Two-part decision:
 *  - `decided`: strict FIFA elimination (mathematically over — no
 *               further kicks can change the outcome). Used to
 *               auto-hide the kick recorder.
 *  - `winner`:  the *current leader* whenever attempts are equal and
 *               made counts differ. This is broader than `decided`
 *               and lets the amateur admin manually end the shootout
 *               after any equal-round moment (e.g. 1-2 after 2 rounds).
 */
function decideWinner(state: {
  madeA: number;
  madeB: number;
  attemptsA: number;
  attemptsB: number;
}): { winner: 'A' | 'B' | null; decided: boolean } {
  const { madeA, madeB, attemptsA, attemptsB } = state;

  // Strict elimination — sudden death phase (both past regulation, equal rounds).
  let decided = false;
  if (
    attemptsA > REGULATION_KICKS_PER_SIDE &&
    attemptsB > REGULATION_KICKS_PER_SIDE &&
    attemptsA === attemptsB &&
    madeA !== madeB
  ) {
    decided = true;
  } else {
    // Strict elimination — regulation phase (mathematically over).
    const remainingA = Math.max(0, REGULATION_KICKS_PER_SIDE - attemptsA);
    const remainingB = Math.max(0, REGULATION_KICKS_PER_SIDE - attemptsB);
    const bestA = madeA + remainingA;
    const bestB = madeB + remainingB;
    if (madeA > bestB || madeB > bestA) decided = true;
  }

  // Broader "current leader" — set whenever both sides have taken the
  // same number of kicks and one leads. This is the value UIs and
  // reports use to name the winner if the admin ends the shootout.
  let winner: 'A' | 'B' | null = null;
  if (attemptsA === attemptsB && madeA !== madeB) {
    winner = madeA > madeB ? 'A' : 'B';
  } else if (decided) {
    winner = madeA > madeB ? 'A' : 'B';
  }

  return { winner, decided };
}

/**
 * Compute which side takes the next kick given first-kicker preference
 * and current attempt counts. Returns null if shootout is decided or
 * already manually ended.
 */
export function nextKickSide(
  state: ShootoutState,
  /** Fallback when no kicks recorded yet — from UI selector. */
  fallbackFirstKicker: 'A' | 'B' = 'A',
): 'A' | 'B' | null {
  if (state.decided || state.ended) return null;
  const first = state.firstKicker ?? fallbackFirstKicker;
  if (state.attemptsA === state.attemptsB) return first;
  return state.attemptsA > state.attemptsB ? 'B' : 'A';
}

/**
 * Determine whether the shootout is currently in a state where the
 * admin is allowed to press "End shootout" and lock the result.
 *
 * Amateur-league policy (relaxed from strict FIFA elimination):
 *   - kicks non-empty
 *   - attemptsA === attemptsB          (both sides took the same number)
 *   - madeA !== madeB                  (someone is ahead — never end tied)
 *   - not already ended
 *
 * We intentionally do NOT require mathematical elimination (`decided`).
 * At the end of any completed round, if one side leads, the admin can
 * agree with players to stop and lock the result.
 */
export function canEndShootout(state: ShootoutState): boolean {
  return (
    !state.ended &&
    state.kicks.length > 0 &&
    state.attemptsA === state.attemptsB &&
    state.madeA !== state.madeB
  );
}

/**
 * Winner *for the purposes of a manual end-shootout*. Falls back to
 * the strict `decided` winner when set; otherwise picks the higher
 * `made` count at the current equal-attempts moment. Returns null
 * only when made counts are equal (which `canEndShootout` blocks).
 */
export function endShootoutWinner(state: ShootoutState): 'A' | 'B' | null {
  if (state.winner) return state.winner;
  if (state.madeA === state.madeB) return null;
  return state.madeA > state.madeB ? 'A' : 'B';
}
