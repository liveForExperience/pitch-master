export const ACTIVE_LIMIT = 5;
export const ARCHIVED_LIMIT = 30;

export type RecentEvent = {
  id: string;
  shortCode: string;
  name: string;
  pin: string;
  createdAt: number;
  visitedAt: number;
};

function dedupeByShortCode(list: RecentEvent[], shortCode: string): RecentEvent[] {
  return list.filter((e) => e.shortCode !== shortCode);
}

export function rememberRecentEvent(
  recentEvents: RecentEvent[],
  evt: Omit<RecentEvent, 'visitedAt'> & { visitedAt?: number },
  now = Date.now(),
): RecentEvent[] {
  const entry: RecentEvent = {
    ...evt,
    createdAt: evt.createdAt || now,
    visitedAt: evt.visitedAt ?? now,
  };
  return [entry, ...dedupeByShortCode(recentEvents, evt.shortCode)].slice(0, ACTIVE_LIMIT);
}

export function archiveRecentEvent(
  recentEvents: RecentEvent[],
  archivedEvents: RecentEvent[],
  shortCode: string,
): { recentEvents: RecentEvent[]; archivedEvents: RecentEvent[] } | null {
  const item = recentEvents.find((e) => e.shortCode === shortCode);
  if (!item) return null;
  return {
    recentEvents: recentEvents.filter((e) => e.shortCode !== shortCode),
    archivedEvents: [item, ...dedupeByShortCode(archivedEvents, shortCode)].slice(0, ARCHIVED_LIMIT),
  };
}

export function removeStoredEvent(
  recentEvents: RecentEvent[],
  archivedEvents: RecentEvent[],
  shortCode: string,
): { recentEvents: RecentEvent[]; archivedEvents: RecentEvent[] } {
  return {
    recentEvents: recentEvents.filter((e) => e.shortCode !== shortCode),
    archivedEvents: archivedEvents.filter((e) => e.shortCode !== shortCode),
  };
}

export function findStoredEventByShortCode(
  recentEvents: RecentEvent[],
  archivedEvents: RecentEvent[],
  shortCode: string,
): RecentEvent | undefined {
  const code = shortCode.toUpperCase();
  return (
    recentEvents.find((e) => e.shortCode === code) ??
    archivedEvents.find((e) => e.shortCode === code)
  );
}
