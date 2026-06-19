import { useSessionStore, type RecentEvent } from '../stores/session';

export type { RecentEvent };

export function getAdminToken(eventId: string): string | null {
  return useSessionStore.getState().getAdminToken(eventId);
}

export function setAdminToken(eventId: string, token: string): void {
  useSessionStore.getState().setAdminToken(eventId, token);
}

export function rememberEvent(evt: Omit<RecentEvent, 'visitedAt'>): void {
  useSessionStore.getState().rememberEvent(evt);
}

export function removeRecentEvent(shortCode: string): void {
  useSessionStore.getState().removeRecentEvent(shortCode);
}

export function getRecentEvents(): RecentEvent[] {
  return useSessionStore.getState().getRecentEvents();
}

if (typeof window !== 'undefined') {
  window.addEventListener('pitchmaster:new-admin-token', (ev) => {
    const token = (ev as CustomEvent<string>).detail;
    void token;
  });
}
