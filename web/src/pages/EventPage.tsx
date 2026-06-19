import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchEvent, finishEvent as finishEventApi } from '../api/events';
import { clearRosterImportPool } from '../lib/roster-import-store';
import { ApiError } from '../api/client';
import type { EventDetail } from '../api/types';
import { EventCredentialsCard } from '../components/EventCredentialsCard';
import { EventSharePanel } from '../components/report/EventSharePanel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../components/ui/dialog';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { useT } from '../i18n';
import { isEventEnded } from '../lib/event-status';
import {
  archiveEvent,
  findStoredEvent,
  getAdminToken,
  rememberEvent,
  removeRecentEvent,
} from '../lib/storage';
import { useSessionStore } from '../stores/session';

export function EventPage() {
  const t = useT();
  const { shortCode = '' } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const adminTokens = useSessionStore((s) => s.adminTokens);

  useEffect(() => {
    const code = shortCode.trim().toUpperCase();
    if (!code) return;
    setError('');
    setNotFound(false);
    setEvent(null);
    fetchEvent(code)
      .then((data) => {
        setEvent(data);
        if (isEventEnded(data)) {
          archiveEvent(data.shortCode);
        }
        const token = getAdminToken(data.id);
        if (token && !isEventEnded(data)) {
          const stored = findStoredEvent(data.shortCode);
          rememberEvent({
            id: data.id,
            shortCode: data.shortCode,
            name: data.name,
            pin: stored?.pin ?? '',
            createdAt: stored?.createdAt ?? data.createdAt,
          });
        }
      })
      .catch((err: Error) => {
        if (err instanceof ApiError && err.code === 'not_found') {
          removeRecentEvent(code);
          setNotFound(true);
          return;
        }
        setError(err.message);
      });
  }, [shortCode, adminTokens]);

  const adminToken = event ? getAdminToken(event.id) : null;
  const isAdmin = Boolean(adminToken);
  const storedPin = event ? findStoredEvent(event.shortCode)?.pin : undefined;
  const ended = event ? isEventEnded(event) : false;

  const confirmFinish = async () => {
    if (!event || !adminToken) return;
    setFinishing(true);
    setError('');
    try {
      await finishEventApi(event.id, adminToken);
      clearRosterImportPool(event.id);
      archiveEvent(event.shortCode);
      const data = await fetchEvent(event.shortCode);
      setEvent(data);
      setFinishOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('event.finish.error'));
    } finally {
      setFinishing(false);
    }
  };

  if (notFound) {
    return (
      <PageShell title={t('event.notFound.title')} backTo="/">
        <Card>
          <p className="text-sm text-textPri">
            {t('event.notFound.body', { code: shortCode.toUpperCase() })}
          </p>
          <p className="mt-2 text-xs text-textSec">{t('event.notFound.hint')}</p>
          <div className="mt-4 space-y-2">
            <PrimaryButton>
              <Link to="/events/new" className="block w-full">
                {t('event.notFound.create')}
              </Link>
            </PrimaryButton>
            <Link to="/" className="block text-center text-sm text-primary">
              {t('event.notFound.home')}
            </Link>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell title={event?.name ?? t('event.fallbackTitle')} backTo="/">
      {error && <p className="text-sm text-danger">{error}</p>}
      {!event && !error && <p className="text-sm text-textSec">{t('event.loading')}</p>}
      {event && (
        <>
          {!isAdmin && (
            <Card className="border-primary/30 bg-primary/5">
              <p className="text-sm font-medium text-textPri">{t('event.viewer.title')}</p>
              <p className="mt-1 text-xs text-textSec">
                {t('event.viewer.bodyA')}
                <Link to={`/admin/restore?code=${event.shortCode}`} className="text-primary">
                  {t('event.viewer.restoreLink')}
                </Link>
                {t('event.viewer.bodyB')}
              </p>
            </Card>
          )}

          {!isAdmin && (
            <Card>
              <p className="text-sm text-textSec">{t('event.shareCode')}</p>
              <p className="font-mono text-2xl font-bold text-primary">{event.shortCode}</p>
            </Card>
          )}

          {isAdmin && storedPin && (
            <EventCredentialsCard
              shortCode={event.shortCode}
              pin={storedPin}
              hint={t('cred.adminHint')}
            />
          )}

          {isAdmin && !storedPin && (
            <Card>
              <p className="text-sm text-textSec">{t('event.shareCode')}</p>
              <p className="font-mono text-2xl font-bold text-primary">{event.shortCode}</p>
              <p className="mt-2 text-xs text-textSec">{t('event.noPinHint')}</p>
            </Card>
          )}

          {event.games.length > 0 && (
            <EventSharePanel eventName={event.name} shortCode={event.shortCode} />
          )}

          <section className="border-t border-border pt-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-body font-bold text-textPri">{t('event.games.title')}</p>
              <div className="flex items-center gap-3">
                {event.games.length > 0 && (
                  <Link
                    to={`/events/${event.shortCode}/report`}
                    className="text-sm text-primary"
                  >
                    {t('event.games.share')}
                  </Link>
                )}
                {isAdmin && !ended && (
                  <Link
                    to={`/games/new?eventId=${event.id}&shortCode=${event.shortCode}`}
                    className="text-sm font-semibold text-primary"
                  >
                    {t('event.games.new')}
                  </Link>
                )}
              </div>
            </div>
            {event.games.length === 0 ? (
              <p className="text-sm text-textSec">
                {isAdmin ? t('event.games.emptyAdmin') : t('event.games.emptyViewer')}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {event.games.map((g) => {
                  const a = event.teams.find((tm) => tm.id === g.teamAId)?.name ?? 'A';
                  const b = event.teams.find((tm) => tm.id === g.teamBId)?.name ?? 'B';
                  return (
                    <li key={g.id}>
                      <Link
                        to={isAdmin ? `/games/${g.id}/record` : `/games/${g.id}`}
                        className="block py-3 active:bg-elevated"
                      >
                        <div className="font-medium text-textPri">
                          {a} vs {b}
                        </div>
                        <div className="mt-0.5 text-xs text-textSec">
                          {g.status}
                          {isAdmin ? t('event.games.adminSuffix') : t('event.games.viewerSuffix')}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {isAdmin && !ended ? (
            <>
              <PrimaryButton>
                <Link to={`/events/${shortCode}/setup`} className="block w-full">
                  {t('event.setupCta')}
                </Link>
              </PrimaryButton>
              <button
                type="button"
                onClick={() => setFinishOpen(true)}
                className="min-h-12 w-full rounded-2xl border border-danger/30 px-4 py-3 text-sm font-semibold text-danger"
              >
                {t('event.finish')}
              </button>
            </>
          ) : isAdmin ? null : (
            <Card>
              <h2 className="mb-2 font-semibold">{t('event.teams.title')}</h2>
              {event.teams.length === 0 ? (
                <p className="text-sm text-textSec">{t('event.teams.empty')}</p>
              ) : (
                <ul className="space-y-3">
                  {event.teams.map((team) => (
                    <li key={team.id}>
                      <div className="mb-1 flex items-center gap-2 font-medium">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ background: team.colorHex }}
                        />
                        {team.name}
                      </div>
                      <p className="text-sm text-textSec">
                        {team.roster.length > 0
                          ? team.roster.map((p) => p.name).join('、')
                          : t('event.teams.noRoster')}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
            <DialogContent>
              <DialogTitle>{t('event.finish.title')}</DialogTitle>
              <DialogDescription>{t('event.finish.desc')}</DialogDescription>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setFinishOpen(false)}
                  className="min-h-12 flex-1 rounded-xl border border-border px-3 text-sm font-semibold text-textSec"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  disabled={finishing}
                  onClick={() => void confirmFinish()}
                  className="min-h-12 flex-1 rounded-xl bg-danger px-3 text-sm font-semibold text-textInv disabled:opacity-50"
                >
                  {finishing ? t('event.finish.processing') : t('event.finish.confirm')}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </PageShell>
  );
}
