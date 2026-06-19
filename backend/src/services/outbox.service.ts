import type { AppDb } from '../db/client.js';
import { ValidationError } from '../lib/errors.js';
import { recordGameEvent, undoGameEvent } from './game-ops.service.js';

export type BatchGameEventInput = {
  clientEventId: string;
  type: 'GOAL' | 'OWN_GOAL' | 'UNDO';
  teamSide?: 'A' | 'B';
  scorerRosterId?: string;
  assistantRosterId?: string;
  /** Server-side game_event.id */
  undoTargetEventId?: string;
  /** Offline goal clientEventId resolved within the same batch */
  undoTargetClientEventId?: string;
  clientTs: number;
};

export type BatchReplayResult = {
  applied: number;
  scoreA: number;
  scoreB: number;
  idempotentHits: number;
};

function compareBatchOrder(a: BatchGameEventInput, b: BatchGameEventInput): number {
  return a.clientTs - b.clientTs || a.clientEventId.localeCompare(b.clientEventId);
}

export function sortBatchEvents(events: BatchGameEventInput[]): BatchGameEventInput[] {
  return [...events].sort(compareBatchOrder);
}

export async function replayGameEventsBatch(
  db: AppDb,
  gameId: string,
  events: BatchGameEventInput[],
): Promise<BatchReplayResult> {
  if (events.length === 0) {
    throw new ValidationError('events must be a non-empty array');
  }

  const sorted = sortBatchEvents(events);
  const clientToServer = new Map<string, string>();
  let idempotentHits = 0;
  let lastScore = { scoreA: 0, scoreB: 0 };

  for (const item of sorted) {
    if (item.type === 'UNDO') {
      const targetId =
        item.undoTargetEventId ??
        (item.undoTargetClientEventId
          ? clientToServer.get(item.undoTargetClientEventId)
          : undefined);
      if (!targetId) {
        throw new ValidationError(
          `Cannot resolve undo target for clientEventId ${item.clientEventId}`,
        );
      }
      const result = await undoGameEvent(db, gameId, targetId, {
        clientEventId: item.clientEventId,
        clientTs: item.clientTs,
      });
      if ('idempotent' in result && result.idempotent) idempotentHits++;
      lastScore = { scoreA: result.scoreA, scoreB: result.scoreB };
      continue;
    }

    const result = await recordGameEvent(db, gameId, {
      clientEventId: item.clientEventId,
      type: item.type,
      teamSide: item.teamSide,
      scorerRosterId: item.scorerRosterId,
      assistantRosterId: item.assistantRosterId,
      clientTs: item.clientTs,
    });
    if (result.idempotent) idempotentHits++;
    clientToServer.set(item.clientEventId, result.event.id);
    lastScore = { scoreA: result.scoreA, scoreB: result.scoreB };
  }

  return {
    applied: sorted.length,
    scoreA: lastScore.scoreA,
    scoreB: lastScore.scoreB,
    idempotentHits,
  };
}

/** @internal for tests */
export function resolveUndoTarget(
  item: BatchGameEventInput,
  clientToServer: Map<string, string>,
): string | undefined {
  return (
    item.undoTargetEventId ??
    (item.undoTargetClientEventId
      ? clientToServer.get(item.undoTargetClientEventId)
      : undefined)
  );
}
