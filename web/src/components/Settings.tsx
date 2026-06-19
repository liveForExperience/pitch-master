import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Gear } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { setLocale, useLocale, useT, type Locale } from '../i18n';
import { setTheme, useTheme, type Theme } from '../lib/theme';
import { cn } from '../lib/cn';
import { useOnboardingStore } from '../stores/onboarding';
import { TOUR_IDS, type TourId } from './tour/tour-config';
import { useSessionStore } from '../stores/session';

function SegmentedRow<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: ReadonlyArray<{ id: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <div className="inline-flex w-full rounded-xl border border-border bg-chipBg p-1">
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors',
              active
                ? 'bg-surface text-textPri shadow-sm'
                : 'text-textSec hover:text-textPri',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const locale = useLocale();
  const theme = useTheme();
  const nav = useNavigate();
  const location = useLocation();
  const recentEvents = useSessionStore((s) => s.recentEvents);
  const requestTour = useOnboardingStore((s) => s.requestTour);

  // Pick the best URL to land on for each tour, using the current route if
  // it already provides the right context, otherwise the most recent event.
  // Without this, tapping e.g. "Roster tour" from the home page just resets
  // the flag — the actual tour never fires because no setup page is mounted.
  const targetFor = (id: TourId): string => {
    const codeFromUrl = location.pathname.match(/^\/events\/([^/]+)/)?.[1];
    const shortCode = codeFromUrl ?? recentEvents[0]?.shortCode;
    switch (id) {
      case TOUR_IDS.home:
        return '/';
      case TOUR_IDS.eventAdmin:
        return shortCode ? `/events/${shortCode}` : '/';
      case TOUR_IDS.eventSetup:
        return shortCode ? `/events/${shortCode}/setup` : '/';
      case TOUR_IDS.record:
        // No game id is known up front; land on the event page so the user
        // can pick a game — pendingTour stays set and fires when they enter
        // a recording screen.
        return shortCode ? `/events/${shortCode}` : '/';
      default:
        return '/';
    }
  };

  const replayTour = (id: TourId) => {
    requestTour(id);
    const target = targetFor(id);
    setOpen(false);
    // Defer the route change until after the Settings dialog has animated
    // out; otherwise the tour's portal can render behind focus-trap residue.
    window.setTimeout(() => {
      if (target !== location.pathname + location.search) {
        nav(target);
      }
    }, 180);
  };

  const hasEventContext = Boolean(
    location.pathname.match(/^\/events\/([^/]+)/)?.[1] ?? recentEvents[0]?.shortCode,
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-tour="nav-settings"
        aria-label={t('settings.openLabel')}
        title={t('settings.navTooltip')}
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-full text-textSec active:bg-elevated',
          className,
        )}
      >
        <Gear size={20} weight="duotone" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{t('settings.title')}</DialogTitle>
          <DialogDescription>{t('settings.subtitle')}</DialogDescription>

          <div className="mt-5 space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold text-textPri">
                {t('settings.language')}
              </p>
              <SegmentedRow<Locale>
                value={locale}
                onChange={setLocale}
                options={[
                  { id: 'zh', label: t('settings.language.zh') },
                  { id: 'en', label: t('settings.language.en') },
                ]}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-textPri">
                {t('settings.theme')}
              </p>
              <SegmentedRow<Theme>
                value={theme}
                onChange={setTheme}
                options={[
                  { id: 'light', label: t('settings.theme.light') },
                  { id: 'dark', label: t('settings.theme.dark') },
                ]}
              />
            </div>

            <div className="border-t border-border pt-5">
              <p className="text-sm font-semibold text-textPri">{t('tour.replay.title')}</p>
              <p className="mt-1 text-xs text-textSec">{t('tour.replay.desc')}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => replayTour(TOUR_IDS.home)}
                  className="min-h-10 rounded-xl border border-border px-2 text-xs font-semibold text-textPri active:bg-elevated"
                >
                  {t('tour.replay.home')}
                </button>
                <button
                  type="button"
                  onClick={() => replayTour(TOUR_IDS.eventAdmin)}
                  disabled={!hasEventContext}
                  className="min-h-10 rounded-xl border border-border px-2 text-xs font-semibold text-textPri active:bg-elevated disabled:opacity-40"
                >
                  {t('tour.replay.event')}
                </button>
                <button
                  type="button"
                  onClick={() => replayTour(TOUR_IDS.eventSetup)}
                  disabled={!hasEventContext}
                  className="min-h-10 rounded-xl border border-border px-2 text-xs font-semibold text-textPri active:bg-elevated disabled:opacity-40"
                >
                  {t('tour.replay.setup')}
                </button>
                <button
                  type="button"
                  onClick={() => replayTour(TOUR_IDS.record)}
                  disabled={!hasEventContext}
                  className="min-h-10 rounded-xl border border-border px-2 text-xs font-semibold text-textPri active:bg-elevated disabled:opacity-40"
                >
                  {t('tour.replay.record')}
                </button>
              </div>
              {!hasEventContext && (
                <p className="mt-2 text-[11px] text-textSec">{t('tour.replay.needEvent')}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-6 min-h-11 w-full rounded-xl border border-border text-sm font-semibold text-textSec active:bg-elevated"
          >
            {t('common.close')}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
