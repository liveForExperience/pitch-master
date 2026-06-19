import { useEffect } from 'react';
import { fetchEvent } from '../api/events';
import { isEventEnded } from './event-status';
import { archiveEvent, removeRecentEvent } from './storage';
import { useSessionStore } from '../stores/session';

/** Move server-finished events into local archive; drop stale short codes. */
export function useSyncArchivedEvents() {
  useEffect(() => {
    const sync = async () => {
      const { recentEvents, archivedEvents } = useSessionStore.getState();
      const all = [...recentEvents, ...archivedEvents];
      for (const e of all) {
        try {
          const data = await fetchEvent(e.shortCode);
          if (isEventEnded(data)) {
            archiveEvent(e.shortCode);
          }
        } catch {
          removeRecentEvent(e.shortCode);
        }
      }
    };
    void sync();
  }, []);
}
