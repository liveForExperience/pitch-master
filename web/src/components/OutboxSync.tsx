import { useEffect } from 'react';
import { listenOutboxFlushFromSw, registerOutboxBackgroundSync } from '../lib/outbox/register-sync';
import { useNetworkStore } from '../stores/network';
import { useOutboxStore } from '../stores/outbox';

const PROBE_INTERVAL_MS = 30_000;

/** Mount once in App — hydrates outbox, probes network, flushes when back online or via Background Sync. */
export function OutboxSync() {
  const hydrate = useOutboxStore((s) => s.hydrate);
  const flush = useOutboxStore((s) => s.flush);
  const items = useOutboxStore((s) => s.items);
  const setOnline = useNetworkStore((s) => s.setOnline);
  const probe = useNetworkStore((s) => s.probe);

  useEffect(() => {
    void hydrate().then(async () => {
      await probe();
      void flush();
      void registerOutboxBackgroundSync();
    });
  }, [hydrate, flush, probe]);

  useEffect(() => {
    const runFlush = () => void flush();

    const onOnline = () => {
      void probe().then((reachable) => {
        if (reachable) runFlush();
      });
    };
    const onOffline = () => setOnline(false);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void probe().then((ok) => ok && runFlush());
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);
    const stopSw = listenOutboxFlushFromSw(runFlush);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
      stopSw();
    };
  }, [flush, probe, setOnline]);

  useEffect(() => {
    const pending = items.some(
      (i) => i.status === 'PENDING' || i.status === 'FAILED' || i.status === 'SENDING',
    );
    if (!pending) return;

    void registerOutboxBackgroundSync();
    const timer = window.setInterval(() => {
      void probe().then((ok) => {
        if (ok) void flush();
      });
    }, PROBE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [items, flush, probe]);

  return null;
}
