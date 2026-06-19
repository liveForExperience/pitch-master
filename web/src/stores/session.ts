import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ACTIVE_LIMIT,
  archiveRecentEvent,
  rememberRecentEvent,
  removeStoredEvent,
  type RecentEvent,
} from './session-logic';

export type { RecentEvent };

type SessionState = {
  adminTokens: Record<string, string>;
  recentEvents: RecentEvent[];
  archivedEvents: RecentEvent[];
  setAdminToken: (eventId: string, token: string) => void;
  getAdminToken: (eventId: string) => string | null;
  rememberEvent: (evt: Omit<RecentEvent, 'visitedAt'> & { visitedAt?: number }) => void;
  archiveEvent: (shortCode: string) => void;
  removeRecentEvent: (shortCode: string) => void;
  getRecentEvents: () => RecentEvent[];
  getArchivedEvents: () => RecentEvent[];
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      adminTokens: {},
      recentEvents: [],
      archivedEvents: [],

      setAdminToken: (eventId, token) =>
        set((s) => ({ adminTokens: { ...s.adminTokens, [eventId]: token } })),

      getAdminToken: (eventId) => get().adminTokens[eventId] ?? null,

      rememberEvent: (evt) =>
        set((s) => ({
          recentEvents: rememberRecentEvent(s.recentEvents, evt),
        })),

      archiveEvent: (shortCode) =>
        set((s) => {
          const next = archiveRecentEvent(s.recentEvents, s.archivedEvents, shortCode);
          return next ?? s;
        }),

      removeRecentEvent: (shortCode) =>
        set((s) => removeStoredEvent(s.recentEvents, s.archivedEvents, shortCode)),

      getRecentEvents: () => get().recentEvents,
      getArchivedEvents: () => get().archivedEvents,
    }),
    {
      name: 'pitchmaster-session',
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as SessionState & { archivedEvents?: RecentEvent[] };
        if (version < 1) {
          return {
            ...state,
            recentEvents: (state.recentEvents ?? []).slice(0, ACTIVE_LIMIT),
            archivedEvents: state.archivedEvents ?? [],
          };
        }
        return state;
      },
    },
  ),
);
