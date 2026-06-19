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
  /** archivedEvents.length when user last opened /archived */
  archivedSeenCount: number;
  setAdminToken: (eventId: string, token: string) => void;
  getAdminToken: (eventId: string) => string | null;
  rememberEvent: (evt: Omit<RecentEvent, 'visitedAt'> & { visitedAt?: number }) => void;
  archiveEvent: (shortCode: string) => void;
  removeRecentEvent: (shortCode: string) => void;
  getRecentEvents: () => RecentEvent[];
  getArchivedEvents: () => RecentEvent[];
  markArchivedSeen: () => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      adminTokens: {},
      recentEvents: [],
      archivedEvents: [],
      archivedSeenCount: 0,

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
      markArchivedSeen: () =>
        set((s) => ({ archivedSeenCount: s.archivedEvents.length })),
    }),
    {
      name: 'pitchmaster-session',
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as SessionState & {
          archivedEvents?: RecentEvent[];
          archivedSeenCount?: number;
        };
        if (version < 1) {
          return {
            ...state,
            recentEvents: (state.recentEvents ?? []).slice(0, ACTIVE_LIMIT),
            archivedEvents: state.archivedEvents ?? [],
            archivedSeenCount: state.archivedSeenCount ?? 0,
          };
        }
        if (version < 2) {
          return {
            ...state,
            archivedSeenCount: state.archivedSeenCount ?? state.archivedEvents?.length ?? 0,
          };
        }
        return state;
      },
    },
  ),
);
