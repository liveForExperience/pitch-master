type CacheEntry = { png: Buffer; expiresAt: number };

const CACHE_TTL_MS = 60_000;
const store = new Map<string, CacheEntry>();

export function getPosterCache(key: string): Buffer | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return hit.png;
}

export function setPosterCache(key: string, png: Buffer): void {
  store.set(key, { png, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function resetPosterCacheForTests(): void {
  store.clear();
}
