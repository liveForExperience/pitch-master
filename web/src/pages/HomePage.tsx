import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/ui/layout';
import { EventListItem } from '../components/EventListItem';
import { Tour } from '../components/tour/Tour';
import { HOME_TOUR_STEPS, TOUR_IDS } from '../components/tour/tour-config';
import { usePageTour } from '../components/tour/use-page-tour';
import { useT } from '../i18n';
import { useSyncArchivedEvents } from '../lib/use-sync-archived-events';
import { useSessionStore } from '../stores/session';

export function HomePage() {
  const t = useT();
  const recent = useSessionStore((s) => s.recentEvents);
  const nav = useNavigate();
  const [joinCode, setJoinCode] = useState('');

  useSyncArchivedEvents();
  const tour = usePageTour(TOUR_IDS.home);

  const goJoin = () => {
    const code = joinCode.trim().toUpperCase().replace(/\s/g, '');
    if (code.length < 4) return;
    nav(`/events/${code}`);
  };

  return (
    <PageShell title={t('home.title')}>
      <Link
        to="/events/new"
        data-tour="home-new-event"
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-textInv active:bg-primaryDk"
      >
        {t('home.newEvent')}
      </Link>

      <div className="divide-y divide-border border-y border-border">
        <section data-tour="home-join" className="py-6">
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
      </div>
      <Tour
        tourId={TOUR_IDS.home}
        steps={HOME_TOUR_STEPS}
        open={tour.open}
        onClose={tour.close}
      />
    </PageShell>
  );
}
