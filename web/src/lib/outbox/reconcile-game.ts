import type { GameDetail } from '../../api/types';
import { mergeGameWithOutbox } from './merge-game';
import type { OutboxItem } from './types';

/** Drop outbox rows already acknowledged by the server (matched via clientEventId). */
export function filterAcknowledgedOutbox(
  serverEvents: GameDetail['events'],
  pendingItems: OutboxItem[],
): OutboxItem[] {
  const confirmed = new Set(
    serverEvents.map((e) => e.clientEventId).filter((id): id is string => Boolean(id)),
  );
  return pendingItems.filter((item) => !confirmed.has(item.payload.clientEventId));
}

export function reconcileGameWithOutbox(
  game: GameDetail,
  pendingItems: OutboxItem[],
): GameDetail {
  const stillPending = filterAcknowledgedOutbox(game.events, pendingItems);
  return mergeGameWithOutbox(game, stillPending);
}

export function isServerConfirmedEvent(
  eventId: string,
  serverEvents: GameDetail['events'],
): boolean {
  return serverEvents.some((e) => e.id === eventId);
}
