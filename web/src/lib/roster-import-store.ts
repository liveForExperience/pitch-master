const KEY_PREFIX = 'pm:roster-import:';

function storageKey(eventId: string): string {
  return `${KEY_PREFIX}${eventId}`;
}

export function loadRosterImportPool(eventId: string): string[] {
  if (!eventId || typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(storageKey(eventId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  } catch {
    return [];
  }
}

export function saveRosterImportPool(eventId: string, names: string[]): void {
  if (!eventId || typeof sessionStorage === 'undefined') return;
  if (names.length === 0) {
    sessionStorage.removeItem(storageKey(eventId));
    return;
  }
  sessionStorage.setItem(storageKey(eventId), JSON.stringify(names));
}

export function clearRosterImportPool(eventId: string): void {
  if (!eventId || typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(storageKey(eventId));
}
