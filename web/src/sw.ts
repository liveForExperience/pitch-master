/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

const OUTBOX_SYNC_TAG = 'outbox-flush';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(({ url }) => url.pathname.startsWith('/api/'), new NetworkOnly());

const navigationHandler = createHandlerBoundToURL('/index.html');
registerRoute(
  new NavigationRoute(async (options) => {
    try {
      return await navigationHandler(options);
    } catch {
      const offline = await caches.match('/offline.html');
      if (offline) return offline;
      throw new Error('Offline and no fallback');
    }
  }, { denylist: [/^\/api\//] }),
);

self.addEventListener('sync', (event) => {
  const syncEvent = event as ExtendableEvent & { tag: string };
  if (syncEvent.tag !== OUTBOX_SYNC_TAG) return;
  syncEvent.waitUntil(notifyClientsFlush());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'REGISTER_OUTBOX_SYNC') {
    const reg = self.registration as ServiceWorkerRegistration & {
      sync: { register(tag: string): Promise<void> };
    };
    event.waitUntil(reg.sync.register(OUTBOX_SYNC_TAG).catch(() => undefined));
  }
});

async function notifyClientsFlush(): Promise<void> {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ type: 'OUTBOX_FLUSH' });
  }
}
