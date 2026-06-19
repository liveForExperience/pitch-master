import { batchGameEvents } from '../../api/events';
import { getAdminToken } from '../storage';
import { getOrCreateDeviceId } from '../device-id';
import { randomUUID } from '../uuid';
import {
  addOutboxItem,
  listOutboxItems,
  removeOutboxItems,
  updateOutboxItem,
} from './db';
import { groupOutboxByGameId, sortOutboxItems } from './merge-game';
import { registerOutboxBackgroundSync } from './register-sync';
import type { BatchGameEventInput, OutboxGameEventPayload, OutboxItem } from './types';

const MAX_RETRIES = 5;

export function isFlushable(item: OutboxItem): boolean {
  if (item.status === 'PENDING') return true;
  if (item.status === 'FAILED' && item.retryCount < MAX_RETRIES) return true;
  return false;
}

export function toBatchPayload(items: OutboxItem[]): BatchGameEventInput[] {
  return sortOutboxItems(items).map((item) => ({
    ...item.payload,
    clientTs: item.clientTs,
  }));
}

let flushChain: Promise<void> = Promise.resolve();

export function scheduleFlush(run: () => Promise<void>): Promise<void> {
  flushChain = flushChain.then(run).catch(() => undefined);
  return flushChain;
}

export async function flushOutbox(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  const all = await listOutboxItems();
  const flushable = all.filter(isFlushable);
  if (flushable.length === 0) return;

  const groups = groupOutboxByGameId(flushable);

  for (const [gameId, groupItems] of groups) {
    const eventId = groupItems[0]!.eventId;
    const token = getAdminToken(eventId);
    if (!token) continue;

    const sending = groupItems.map((item) => ({ ...item, status: 'SENDING' as const }));
    await Promise.all(sending.map((item) => updateOutboxItem(item)));

    try {
      await batchGameEvents(
        gameId,
        toBatchPayload(sending),
        token,
        getOrCreateDeviceId(),
      );
      await removeOutboxItems(sending.map((i) => i.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : '同步失败';
      await Promise.all(
        sending.map((item) =>
          updateOutboxItem({
            ...item,
            status: 'FAILED',
            retryCount: item.retryCount + 1,
            lastError: message,
          }),
        ),
      );
      void registerOutboxBackgroundSync();
    }
  }
}

export async function enqueueGameEvent(
  gameId: string,
  eventId: string,
  payload: OutboxGameEventPayload,
  clientTs: number,
): Promise<OutboxItem> {
  const item: OutboxItem = {
    id: randomUUID(),
    gameId,
    eventId,
    payload,
    clientTs,
    status: 'PENDING',
    retryCount: 0,
  };
  await addOutboxItem(item);
  void registerOutboxBackgroundSync();
  return item;
}
