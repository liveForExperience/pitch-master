export const OUTBOX_SYNC_TAG = 'outbox-flush';
export const OUTBOX_FLUSH_MESSAGE = 'OUTBOX_FLUSH';

export function canUseBackgroundSync(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'SyncManager' in window
  );
}

export async function registerOutboxBackgroundSync(): Promise<boolean> {
  if (!canUseBackgroundSync()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const syncCapable = registration as ServiceWorkerRegistration & {
      sync: { register(tag: string): Promise<void> };
    };
    await syncCapable.sync.register(OUTBOX_SYNC_TAG);
    registration.active?.postMessage({ type: 'REGISTER_OUTBOX_SYNC' });
    return true;
  } catch {
    return false;
  }
}

export function listenOutboxFlushFromSw(onFlush: () => void): () => void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return () => undefined;
  }
  const handler = (event: MessageEvent) => {
    if (event.data?.type === OUTBOX_FLUSH_MESSAGE) onFlush();
  };
  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}
