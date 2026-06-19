import type { GameDetail } from '../api/types';

type GameEventRow = GameDetail['events'][number];

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

export function formatGameEventLabel(
  event: GameEventRow,
  names: Map<string, string>,
  teamA?: string,
  teamB?: string,
): string {
  const side = event.teamSide === 'A' ? teamA : event.teamSide === 'B' ? teamB : '';
  const scorer = event.scorerRosterId ? names.get(event.scorerRosterId) : null;
  const assistant = event.assistantRosterId ? names.get(event.assistantRosterId) : null;

  switch (event.type) {
    case 'GOAL':
      if (scorer && assistant) return `${side} ${scorer} 进球（助攻 ${assistant}）`;
      if (scorer) return `${side} ${scorer} 进球`;
      return side ? `${side} 进球` : '进球';
    case 'OWN_GOAL':
      return side ? `${side} 乌龙球` : '乌龙球';
    case 'UNDO':
      return '撤销';
    default:
      return event.type;
  }
}
