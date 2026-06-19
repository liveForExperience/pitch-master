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

export function listActiveScorableEvents(events: GameDetail['events']) {
  const undone = getUndoneEventIds(events);
  return [...events]
    .filter((e) => isActiveScorable(e, undone))
    .reverse();
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
      return side ? t('feed.ownGoal', { side }) : t('feed.ownGoalNoSide');
    case 'UNDO':
      return t('feed.undo');
    default:
      return event.type;
  }
}
