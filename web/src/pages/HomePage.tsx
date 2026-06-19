import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchEvent } from '../api/events';
import { PageShell } from '../components/ui/layout';
import { useT } from '../i18n';
import { isEventEnded } from '../lib/event-status';
import { archiveEvent, removeRecentEvent } from '../lib/storage';
import { useSessionStore } from '../stores/session';

function EventListItem({ name, shortCode }: { name: string; shortCode: string }) {
  return (
    <Link
      to={`/events/${shortCode}`}
      className="flex items-center justify-between py-3 active:bg-elevated"
    >
      <span className="font-medium text-textPri">{name}</span>
      <span className="font-mono text-xs text-textSec">{shortCode}</span>
    </Link>
  );
}

export function HomePage() {
  const t = useT();
  const recent = useSessionStore((s) => s.recentEvents);
  const archived = useSessionStore((s) => s.archivedEvents);
  const nav = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [showArchived, setShowArchived] = useState(false);

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

  const goJoin = () => {
    const code = joinCode.trim().toUpperCase().replace(/\s/g, '');
    if (code.length < 4) return;
    nav(`/events/${code}`);
  };

  return (
    <PageShell title={t('home.title')}>
      <Link
        to="/events/new"
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-textInv active:bg-primaryDk"
      >
        {t('home.newEvent')}
      </Link>

      <div className="divide-y divide-border border-y border-border">
        <section className="py-6">
          <p className="text-body font-bold text-textPri">{t('home.join.title')}</p>
          <p className="mt-1 text-caption text-textSec">{t('home.join.hint')}</p>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              placeholder={t('home.join.placeholder')}
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && goJoin()}
              className="min-h-14 flex-1 rounded-xl border border-border bg-surface px-3 font-mono text-lg tracking-widest text-textPri"
            />
            <button
              type="button"
              onClick={goJoin}
              disabled={joinCode.trim().length < 4}
              className="min-h-14 rounded-xl bg-primary px-4 text-sm font-semibold text-textInv disabled:opacity-40"
            >
              {t('home.join.button')}
            </button>
          </div>
        </section>

        <section className="py-6">
          <p className="text-body font-bold text-textPri">{t('home.restore.title')}</p>
          <p className="mt-1 text-caption text-textSec">{t('home.restore.hint')}</p>
          <Link
            to="/admin/restore"
            className="mt-4 block border border-border py-3 text-center text-sm font-semibold text-primary active:bg-elevated"
          >
            {t('home.restore.link')}
          </Link>
        </section>

        <section className="py-6">
          <p className="text-body font-bold text-textPri">{t('home.ongoing.title')}</p>
          <p className="mt-1 text-caption text-textSec">{t('home.ongoing.hint')}</p>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-textSec">{t('home.ongoing.empty')}</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {recent.map((e) => (
                <li key={e.shortCode}>
                  <EventListItem name={e.name} shortCode={e.shortCode} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="py-6">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setShowArchived((v) => !v)}
            disabled={archived.length === 0}
          >
            <div>
              <p className="text-body font-bold text-textPri">
                {archived.length > 0
                  ? t('home.archived.titleWithCount', { count: archived.length })
                  : t('home.archived.title')}
              </p>
              <p className="mt-1 text-caption text-textSec">{t('home.archived.hint')}</p>
            </div>
            {archived.length > 0 && (
              <span className="text-xs text-primary">
                {showArchived ? t('home.collapse') : t('home.expand')}
              </span>
            )}
          </button>
          {archived.length === 0 ? (
            <p className="mt-4 text-sm text-textSec">{t('home.archived.empty')}</p>
          ) : (
            showArchived && (
              <ul className="mt-2 divide-y divide-border">
                {archived.map((e) => (
                  <li key={e.shortCode}>
                    <EventListItem name={e.name} shortCode={e.shortCode} />
                  </li>
                ))}
              </ul>
            )
          )}
        </section>
      </div>
    </PageShell>
  );
}
