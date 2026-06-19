import { create } from 'zustand';
import {
  enqueueGameEvent,
  flushOutbox,
  scheduleFlush,
} from '../lib/outbox/flush';
import { listOutboxItems } from '../lib/outbox/db';
import type { OutboxGameEventPayload, OutboxItem } from '../lib/outbox/types';

type OutboxState = {
  items: OutboxItem[];
  flushing: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  getItemsForGame: (gameId: string) => OutboxItem[];
  enqueue: (
    gameId: string,
    eventId: string,
    payload: OutboxGameEventPayload,
    clientTs: number,
  ) => Promise<void>;
  flush: () => Promise<void>;
};

export const useOutboxStore = create<OutboxState>((set, get) => ({
  items: [],
  flushing: false,
  hydrated: false,

  hydrate: async () => {
    const items = await listOutboxItems();
    set({ items, hydrated: true });
  },

  refresh: async () => {
    const items = await listOutboxItems();
    set({ items });
  },

  getItemsForGame: (gameId) => get().items.filter((i) => i.gameId === gameId),

  enqueue: async (gameId, eventId, payload, clientTs) => {
    await enqueueGameEvent(gameId, eventId, payload, clientTs);
    await get().refresh();
    void get().flush();
  },

  flush: async () => {
    if (get().flushing) return;
    set({ flushing: true });
    try {
      await scheduleFlush(async () => {
        await flushOutbox();
        await get().refresh();
      });
    } finally {
      set({ flushing: false });
    }
  },
}));
