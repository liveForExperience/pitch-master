import type { GameDetail } from '../../api/types';
import { getUndoneEventIds } from '../game-events';
import type { OutboxItem } from './types';

export function deriveScore(events: GameDetail['events']): { scoreA: number; scoreB: number } {
  const undone = getUndoneEventIds(events);
  let scoreA = 0;
  let scoreB = 0;
  for (const e of events) {
    if (undone.has(e.id)) continue;
    if (e.type === 'GOAL') {
      if (e.teamSide === 'A') scoreA++;
      else if (e.teamSide === 'B') scoreB++;
    }
    if (e.type === 'OWN_GOAL') {
      if (e.teamSide === 'A') scoreB++;
      else if (e.teamSide === 'B') scoreA++;
    }
  }
  return { scoreA, scoreB };
}

export function sortOutboxItems(items: OutboxItem[]): OutboxItem[] {
  return [...items].sort(
    (a, b) => a.clientTs - b.clientTs || a.id.localeCompare(b.id),
  );
}

export function groupOutboxByGameId(items: OutboxItem[]): Map<string, OutboxItem[]> {
  const groups = new Map<string, OutboxItem[]>();
  for (const item of sortOutboxItems(items)) {
    const list = groups.get(item.gameId) ?? [];
    list.push(item);
    groups.set(item.gameId, list);
  }
  return groups;
}

function outboxToSyntheticEvents(items: OutboxItem[]): GameDetail['events'] {
  return sortOutboxItems(items).map((item) => {
    const { payload, clientTs } = item;
    if (payload.type === 'GOAL') {
      return {
        id: payload.clientEventId,
        type: 'GOAL' as const,
        teamSide: payload.teamSide ?? null,
        scorerRosterId: payload.scorerRosterId ?? null,
        assistantRosterId: payload.assistantRosterId ?? null,
        undoTargetEventId: null,
        serverTs: clientTs,
      };
    }
    const targetId =
      payload.undoTargetEventId ?? payload.undoTargetClientEventId ?? null;
    return {
      id: payload.clientEventId,
      type: 'UNDO' as const,
      teamSide: null,
      scorerRosterId: null,
      assistantRosterId: null,
      undoTargetEventId: targetId,
      serverTs: clientTs,
    };
  });
}

export function mergeGameWithOutbox(
  game: GameDetail,
  pendingItems: OutboxItem[],
): GameDetail {
  if (pendingItems.length === 0) return game;
  const synthetic = outboxToSyntheticEvents(pendingItems);
  const events = [...game.events, ...synthetic];
  const { scoreA, scoreB } = deriveScore(events);
  return { ...game, events, scoreA, scoreB };
}

export function resolveUndoTarget(
  targetEventId: string,
  serverEvents: GameDetail['events'],
  pendingItems: OutboxItem[],
): Pick<
  import('./types').OutboxGameEventPayload,
  'undoTargetEventId' | 'undoTargetClientEventId'
> {
  if (serverEvents.some((e) => e.id === targetEventId)) {
    return { undoTargetEventId: targetEventId };
  }
  const pendingGoal = pendingItems.find(
    (i) => i.payload.type === 'GOAL' && i.payload.clientEventId === targetEventId,
  );
  if (pendingGoal) {
    return { undoTargetClientEventId: targetEventId };
  }
  return { undoTargetEventId: targetEventId };
}
