import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RecentEvent = {
  id: string;
  shortCode: string;
  name: string;
  pin: string;
  visitedAt: number;
};

type SessionState = {
  adminTokens: Record<string, string>;
  recentEvents: RecentEvent[];
  setAdminToken: (eventId: string, token: string) => void;
  getAdminToken: (eventId: string) => string | null;
  rememberEvent: (evt: Omit<RecentEvent, 'visitedAt'>) => void;
  getRecentEvents: () => RecentEvent[];
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      adminTokens: {},
      recentEvents: [],
      setAdminToken: (eventId, token) =>
        set((s) => ({ adminTokens: { ...s.adminTokens, [eventId]: token } })),
      getAdminToken: (eventId) => get().adminTokens[eventId] ?? null,
      rememberEvent: (evt) =>
        set((s) => ({
          recentEvents: [
            { ...evt, visitedAt: Date.now() },
            ...s.recentEvents.filter((e) => e.shortCode !== evt.shortCode),
          ].slice(0, 20),
        })),
      getRecentEvents: () => get().recentEvents,
    }),
    { name: 'pitchmaster-session' },
  ),
);
