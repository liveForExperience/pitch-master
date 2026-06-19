import { useSessionStore, type RecentEvent } from '../stores/session';
import { findStoredEventByShortCode } from '../stores/session-logic';

export type { RecentEvent };

export function getAdminToken(eventId: string): string | null {
  return useSessionStore.getState().getAdminToken(eventId);
}

export function setAdminToken(eventId: string, token: string): void {
  useSessionStore.getState().setAdminToken(eventId, token);
}

export function rememberEvent(
  evt: Omit<RecentEvent, 'visitedAt' | 'createdAt'> & {
    createdAt?: number;
    visitedAt?: number;
  },
): void {
  useSessionStore.getState().rememberEvent({
    ...evt,
    createdAt: evt.createdAt ?? Date.now(),
  });
}

export function archiveEvent(shortCode: string): void {
  useSessionStore.getState().archiveEvent(shortCode);
}

export function removeRecentEvent(shortCode: string): void {
  useSessionStore.getState().removeRecentEvent(shortCode);
}

export function getRecentEvents(): RecentEvent[] {
  return useSessionStore.getState().getRecentEvents();
}

export function getArchivedEvents(): RecentEvent[] {
  return useSessionStore.getState().getArchivedEvents();
}

export function findStoredEvent(shortCode: string): RecentEvent | undefined {
  const { recentEvents, archivedEvents } = useSessionStore.getState();
  return findStoredEventByShortCode(recentEvents, archivedEvents, shortCode);
}
