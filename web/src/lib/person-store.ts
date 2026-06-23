const KEY = 'pm:recent-persons';
const MAX = 20;

export function loadRecentPersonIds(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX);
  } catch {
    return [];
  }
}

export function pushRecentPerson(personId: string): void {
  if (typeof localStorage === 'undefined') return;
  const list = loadRecentPersonIds().filter((id) => id !== personId);
  list.unshift(personId);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}
