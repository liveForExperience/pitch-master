import { useMemo, useState } from 'react';
import { PageShell } from '../components/ui/layout';
import { EventListItem } from '../components/EventListItem';
import { useT } from '../i18n';
import { useSyncArchivedEvents } from '../lib/use-sync-archived-events';
import { useSessionStore } from '../stores/session';

function filterArchivedEvents(
  events: ReadonlyArray<{ name: string; shortCode: string }>,
  query: string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return [...events];
  return events.filter(
    (e) => e.name.toLowerCase().includes(q) || e.shortCode.toLowerCase().includes(q),
  );
}

export function ArchivedPage() {
  const t = useT();
  const archived = useSessionStore((s) => s.archivedEvents);
  const [query, setQuery] = useState('');
  useSyncArchivedEvents();

  const filtered = useMemo(() => filterArchivedEvents(archived, query), [archived, query]);

  return (
    <PageShell title={t('home.archived.title')} backTo="/">
      <p className="text-caption text-textSec">{t('home.archived.hint')}</p>
      {archived.length === 0 ? (
        <p className="mt-6 text-sm text-textSec">{t('home.archived.empty')}</p>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('archived.search.placeholder')}
            autoCapitalize="off"
            autoComplete="off"
            enterKeyHint="search"
            className="mt-4 min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-base text-textPri placeholder:text-textSec"
          />
          {filtered.length === 0 ? (
            <p className="mt-6 text-sm text-textSec">{t('archived.search.empty')}</p>
          ) : (
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {filtered.map((e) => (
                <li key={e.shortCode}>
                  <EventListItem name={e.name} shortCode={e.shortCode} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </PageShell>
  );
}
