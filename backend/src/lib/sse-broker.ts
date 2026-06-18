type Emitter = (event: string, data: unknown) => void;

const channels = new Map<string, Set<Emitter>>();

export function subscribe(gameId: string, emit: Emitter): () => void {
  if (!channels.has(gameId)) channels.set(gameId, new Set());
  channels.get(gameId)!.add(emit);
  return () => channels.get(gameId)?.delete(emit);
}

export function broadcast(gameId: string, event: string, data: unknown): void {
  channels.get(gameId)?.forEach((emit) => emit(event, data));
}

export function resetSseBrokerForTests(): void {
  channels.clear();
}
