import type { GameDetail } from '../api/types';
import { t as defaultT } from '../i18n';

type GameEventRow = GameDetail['events'][number];
type T = (key: string, params?: Record<string, string | number>) => string;

export function getUndoneEventIds(events: GameDetail['events']): Set<string> {
  return new Set(
    events
      .filter((e) => e.type === 'UNDO' && e.undoTargetEventId)
      .map((e) => e.undoTargetEventId!),
  );
}

export function isActiveScorable(event: GameEventRow, undone: Set<string>) {
  return (event.type === 'GOAL' || event.type === 'OWN_GOAL') && !undone.has(event.id);
}

export function isActivePenaltyKick(event: GameEventRow, undone: Set<string>) {
  return (
    (event.type === 'PENALTY_MADE' || event.type === 'PENALTY_MISSED') &&
    !undone.has(event.id)
  );
}

export function listActiveScorableEvents(events: GameDetail['events']) {
  const undone = getUndoneEventIds(events);
  return [...events]
    .filter((e) => isActiveScorable(e, undone))
    .reverse();
}

/**
 * Whether an event should appear in the human-visible event feed.
 * This is broader than `isActiveScorable` — it also includes shootout
 * kicks (PENALTY_MADE/PENALTY_MISSED) so admins can audit the full
 * play-by-play. SHOOTOUT_END is a flow-control marker and is hidden.
 */
export function isActiveFeedEvent(event: GameEventRow, undone: Set<string>) {
  if (undone.has(event.id)) return false;
  return (
    event.type === 'GOAL' ||
    event.type === 'OWN_GOAL' ||
    event.type === 'PENALTY_MADE' ||
    event.type === 'PENALTY_MISSED'
  );
}

export function listActiveFeedEvents(events: GameDetail['events']) {
  const undone = getUndoneEventIds(events);
  return [...events].filter((e) => isActiveFeedEvent(e, undone)).reverse();
}

/**
 * Penalty kicks that survived undo, oldest-first. Used by the shootout
 * panel and single-game report to display the running tally.
 */
export function listActivePenaltyKicks(events: GameDetail['events']) {
  const undone = getUndoneEventIds(events);
  return events.filter((e) => isActivePenaltyKick(e, undone));
}

export type ShootoutView = {
  madeA: number;
  madeB: number;
  attemptsA: number;
  attemptsB: number;
  /** Which side kicked first (derived from kicks[0]); null when empty. */
  firstKicker: 'A' | 'B' | null;
  /** Which side takes the next kick, or null if decided / ended. */
  nextSide: 'A' | 'B' | null;
  winner: 'A' | 'B' | null;
  decided: boolean;
  /** True once admin has committed a still-active SHOOTOUT_END event. */
  ended: boolean;
  /** Whether the "end shootout" button should be shown to the admin. */
  canEnd: boolean;
  /** Ordered kicks (oldest first). */
  kicks: Array<{
    id: string;
    teamSide: 'A' | 'B';
    made: boolean;
    scorerRosterId: string | null;
    serverTs: number;
  }>;
};

const REGULATION_KICKS_PER_SIDE = 5;

/**
 * Derive shootout view.
 *
 * @param events           game.events (may contain PENALTY_* / SHOOTOUT_END / UNDO)
 * @param preferredFirst   caller-controlled first-kicker before any kicks exist
 *                         (UI local selector). Ignored once kicks[0] exists.
 */
export function deriveShootoutView(
  events: GameDetail['events'],
  preferredFirst: 'A' | 'B' = 'A',
): ShootoutView {
  const undone = getUndoneEventIds(events);
  let ended = false;
  const kicks: ShootoutView['kicks'] = [];
  let madeA = 0;
  let madeB = 0;
  let attemptsA = 0;
  let attemptsB = 0;

  for (const e of events) {
    if (undone.has(e.id)) continue;
    if (e.type === 'SHOOTOUT_END') {
      ended = true;
      continue;
    }
    if (e.type !== 'PENALTY_MADE' && e.type !== 'PENALTY_MISSED') continue;
    if (e.teamSide !== 'A' && e.teamSide !== 'B') continue;
    const made = e.type === 'PENALTY_MADE';
    kicks.push({
      id: e.id,
      teamSide: e.teamSide,
      made,
      scorerRosterId: e.scorerRosterId,
      serverTs: e.serverTs,
    });
    if (e.teamSide === 'A') {
      attemptsA++;
      if (made) madeA++;
    } else {
      attemptsB++;
      if (made) madeB++;
    }
  }

  const firstKicker: 'A' | 'B' | null = kicks[0]?.teamSide ?? null;

  // Strict elimination (auto-hide kick recorder). See backend
  // shootout.service.ts::decideWinner for the same two-part logic.
  let decided = false;
  if (
    attemptsA > REGULATION_KICKS_PER_SIDE &&
    attemptsB > REGULATION_KICKS_PER_SIDE &&
    attemptsA === attemptsB &&
    madeA !== madeB
  ) {
    decided = true;
  } else {
    const remainingA = Math.max(0, REGULATION_KICKS_PER_SIDE - attemptsA);
    const remainingB = Math.max(0, REGULATION_KICKS_PER_SIDE - attemptsB);
    const bestA = madeA + remainingA;
    const bestB = madeB + remainingB;
    if (madeA > bestB || madeB > bestA) decided = true;
  }

  // Broader "current leader" — populated whenever attempts are equal
  // and made counts differ. Enables the admin to end the shootout at
  // any equal-round moment (e.g. 1-2 after 2 rounds).
  let winner: 'A' | 'B' | null = null;
  if (attemptsA === attemptsB && madeA !== madeB) {
    winner = madeA > madeB ? 'A' : 'B';
  } else if (decided) {
    winner = madeA > madeB ? 'A' : 'B';
  }

  const first = firstKicker ?? preferredFirst;
  const nextSide: 'A' | 'B' | null =
    ended || decided
      ? null
      : attemptsA === attemptsB
        ? first
        : attemptsA > attemptsB
          ? 'B'
          : 'A';

  // Admin may end whenever rounds match and one side leads —
  // no requirement to be mathematically eliminated.
  const canEnd =
    !ended && kicks.length > 0 && attemptsA === attemptsB && madeA !== madeB;

  return {
    madeA,
    madeB,
    attemptsA,
    attemptsB,
    firstKicker,
    nextSide,
    winner,
    decided,
    ended,
    canEnd,
    kicks,
  };
}

export function findLastActiveScorable(events: GameDetail['events']) {
  const undone = getUndoneEventIds(events);
  return [...events]
    .reverse()
    .find((e) => isActiveScorable(e, undone));
}

export function hasActiveScorable(events: GameDetail['events']) {
  return listActiveScorableEvents(events).length > 0;
}

export function buildRosterNameMap(game: GameDetail): Map<string, string> {
  const map = new Map<string, string>();
  for (const team of [game.teamA, game.teamB]) {
    for (const p of team?.roster ?? []) {
      map.set(p.id, p.name);
    }
  }
  return map;
}

/**
 * Render a one-line description for a game event. `t` defaults to the global
 * locale-aware translator; tests can inject a stub.
 */
export function formatGameEventLabel(
  event: GameEventRow,
  names: Map<string, string>,
  teamA?: string,
  teamB?: string,
  t: T = defaultT,
): string {
  const side = event.teamSide === 'A' ? teamA : event.teamSide === 'B' ? teamB : '';

  const scorer = event.scorerRosterId ? names.get(event.scorerRosterId) : null;
  const assistant = event.assistantRosterId ? names.get(event.assistantRosterId) : null;

  switch (event.type) {
    case 'GOAL':
      if (scorer && assistant) {
        return t('feed.goalAssist', { side: side ?? '', scorer, assistant });
      }
      if (scorer) return t('feed.goal', { side: side ?? '', scorer });
      return side ? t('feed.goalAnon', { side }) : t('feed.goalAnonNoSide');
    case 'OWN_GOAL':
      // scorer (if present) is the player from `event.teamSide` who kicked
      // it into their own net — i.e. the guilty scorer, not the recipient.
      if (scorer) return t('feed.ownGoalScorer', { scorer });
      return side ? t('feed.ownGoal', { side }) : t('feed.ownGoalNoSide');
    case 'PENALTY_MADE':
      if (scorer) return t('feed.penaltyMade', { side: side ?? '', scorer });
      return side ? t('feed.penaltyMadeAnon', { side }) : t('feed.penaltyMadeAnonNoSide');
    case 'PENALTY_MISSED':
      if (scorer) return t('feed.penaltyMissed', { side: side ?? '', scorer });
      return side ? t('feed.penaltyMissedAnon', { side }) : t('feed.penaltyMissedAnonNoSide');
    case 'UNDO':
      return t('feed.undo');
    default:
      return event.type;
  }
}
