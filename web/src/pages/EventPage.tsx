import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteEvent as deleteEventApi, deleteGame as deleteGameApi, fetchEvent, finishEvent as finishEventApi } from '../api/events';
import { clearRosterImportPool } from '../lib/roster-import-store';
import { removeOutboxItemsForGame } from '../lib/outbox/db';
import { useOutboxStore } from '../stores/outbox';
import { ApiError } from '../api/client';
import type { EventDetail } from '../api/types';
import { EventCredentialsCard } from '../components/EventCredentialsCard';
import { EventGameRow } from '../components/event/EventGameRow';
import { EventSharePanel } from '../components/report/EventSharePanel';
import { ConfirmDangerDialog } from '../components/ui/confirm-danger-dialog';
import { Flag, Trash } from '@phosphor-icons/react';
import { DangerActionTile } from '../components/ui/danger-zone';
import { InlineAlert } from '../components/ui/inline-alert';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { PagePanel, PagePanelBody, PagePanelHeader } from '../components/ui/page-panel';
import { StatusChip } from '../components/ui/status-chip';
import { TeamBadge } from '../components/ui/team-badge';
import { Tour } from '../components/tour/Tour';
import { EVENT_ADMIN_TOUR_STEPS, TOUR_IDS } from '../components/tour/tour-config';
import { usePageTour } from '../components/tour/use-page-tour';
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
  const nav = useNavigate();
  const { shortCode = '' } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteGameId, setDeleteGameId] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingGame, setDeletingGame] = useState(false);
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

  const tour = usePageTour(TOUR_IDS.eventAdmin, {
    ready: Boolean(event) && isAdmin && !ended,
  });

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

  const confirmDeleteEvent = async () => {
    if (!event || !adminToken) return;
    setDeleting(true);
    setError('');
    try {
      await deleteEventApi(event.id, adminToken);
      clearRosterImportPool(event.id);
      removeRecentEvent(event.shortCode);
      setDeleteOpen(false);
      nav('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('event.delete.error'));
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteGame = async () => {
    if (!event || !adminToken || !deleteGameId) return;
    setDeletingGame(true);
    setError('');
    try {
      await deleteGameApi(deleteGameId, adminToken);
      await removeOutboxItemsForGame(deleteGameId);
      await useOutboxStore.getState().refresh();
      const data = await fetchEvent(event.shortCode);
      setEvent(data);
      setDeleteGameId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('game.delete.error'));
    } finally {
      setDeletingGame(false);
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
      {error && <InlineAlert>{error}</InlineAlert>}
      {!event && !error && <p className="text-sm text-textSec">{t('event.loading')}</p>}
      {event && (
        <div className="space-y-5 -mt-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
            <StatusChip
              label={ended ? t('event.statusEnded') : t('event.statusActive')}
              variant={ended ? 'finished' : 'playing'}
            />
            {event.games.length > 0 && (
              <span className="text-xs text-textSec">
                {t('event.gameCount', { n: event.games.length })}
              </span>
            )}
          </div>

          {!isAdmin && (
            <PagePanel>
              <PagePanelBody className="space-y-2">
                <p className="text-sm font-medium text-textPri">{t('event.viewer.title')}</p>
                <p className="text-xs leading-relaxed text-textSec">
                  {t('event.viewer.bodyA')}
                  <Link to={`/admin/restore?code=${event.shortCode}`} className="text-primary">
                    {t('event.viewer.restoreLink')}
                  </Link>
                  {t('event.viewer.bodyB')}
                </p>
              </PagePanelBody>
            </PagePanel>
          )}

          {isAdmin && storedPin && (
            <div data-tour="event-credentials">
              <EventCredentialsCard
                shortCode={event.shortCode}
                pin={storedPin}
                eventName={event.name}
              />
            </div>
          )}

          {isAdmin && !storedPin && (
            <section data-tour="event-credentials" className="space-y-1.5 px-1">
              <h2 className="text-base font-semibold tracking-tight text-textPri">
                {t('cred.sectionTitle')}
              </h2>
              <p className="font-mono text-2xl font-bold tracking-widest text-primary">
                {event.shortCode}
              </p>
              <p className="text-xs text-textSec">{t('event.noPinHint')}</p>
            </section>
          )}

          {!isAdmin && (
            <section className="space-y-1.5 px-1">
              <p className="text-xs text-textSec">{t('event.shareCode')}</p>
              <p className="font-mono text-2xl font-bold tracking-widest text-primary">
                {event.shortCode}
              </p>
            </section>
          )}

          {isAdmin && !ended && (
            <PagePanel data-tour="event-setup">
              <PagePanelHeader
                title={t('event.setupSection')}
                subtitle={t('event.setupHint')}
              />
              <PagePanelBody>
                <PrimaryButton>
                  <Link to={`/events/${shortCode}/setup`} className="block w-full">
                    {t('event.setupCta')}
                  </Link>
                </PrimaryButton>
              </PagePanelBody>
            </PagePanel>
          )}

          <PagePanel>
            <PagePanelHeader title={t('event.games.title')} />
            {event.games.length === 0 ? (
              <PagePanelBody className="space-y-3">
                <p className="text-sm text-textSec">
                  {isAdmin ? t('event.games.emptyAdmin') : t('event.games.emptyViewer')}
                </p>
                {isAdmin && !ended && (
                  <PrimaryButton className="min-h-12 rounded-xl text-sm font-bold">
                    <Link
                      to={`/games/new?eventId=${event.id}&shortCode=${event.shortCode}`}
                      data-tour="event-new-game"
                      className="block w-full"
                    >
                      {t('event.games.new')}
                    </Link>
                  </PrimaryButton>
                )}
              </PagePanelBody>
            ) : (
              <>
                <ul data-tour="event-games-list">
                  {event.games.map((g) => {
                    const teamA = event.teams.find((tm) => tm.id === g.teamAId);
                    const teamB = event.teams.find((tm) => tm.id === g.teamBId);
                    return (
                      <EventGameRow
                        key={g.id}
                        gameId={g.id}
                        teamAName={teamA?.name ?? 'A'}
                        teamAColor={teamA?.colorHex ?? '#64748b'}
                        teamBName={teamB?.name ?? 'B'}
                        teamBColor={teamB?.colorHex ?? '#64748b'}
                        status={g.status}
                        scoreA={g.scoreA}
                        scoreB={g.scoreB}
                        isAdmin={isAdmin}
                        onDelete={isAdmin ? () => setDeleteGameId(g.id) : undefined}
                      />
                    );
                  })}
                </ul>
                {isAdmin && !ended && (
                  <div className="border-t border-border p-4">
                    <PrimaryButton className="min-h-12 rounded-xl text-sm font-bold">
                      <Link
                        to={`/games/new?eventId=${event.id}&shortCode=${event.shortCode}`}
                        data-tour="event-new-game"
                        className="block w-full"
                      >
                        {t('event.games.new')}
                      </Link>
                    </PrimaryButton>
                  </div>
                )}
              </>
            )}
          </PagePanel>

          {event.games.length > 0 && (
            <EventSharePanel eventName={event.name} shortCode={event.shortCode} />
          )}

          {isAdmin && (
            <PagePanel data-tour="event-manage">
              <PagePanelHeader
                title={t('event.manageSection')}
                subtitle={t('event.manageHint')}
              />
              <PagePanelBody>
                <div className={ended ? '' : 'grid grid-cols-2 gap-2'}>
                  {!ended && (
                    <DangerActionTile
                      icon={Flag}
                      title={t('event.finish')}
                      tone="warning"
                      onClick={() => setFinishOpen(true)}
                    />
                  )}
                  <DangerActionTile
                    icon={Trash}
                    title={t('event.delete')}
                    tone="danger"
                    onClick={() => setDeleteOpen(true)}
                  />
                </div>
              </PagePanelBody>
            </PagePanel>
          )}

          {!isAdmin && (
            <PagePanel>
              <PagePanelHeader title={t('event.teams.title')} />
              <PagePanelBody>
                {event.teams.length === 0 ? (
                  <p className="text-sm text-textSec">{t('event.teams.empty')}</p>
                ) : (
                  <ul className="space-y-4">
                    {event.teams.map((team) => (
                      <li key={team.id}>
                        <TeamBadge name={team.name} colorHex={team.colorHex} />
                        <p className="mt-2 text-sm leading-relaxed text-textSec">
                          {team.roster.length > 0
                            ? team.roster.map((p) => p.name).join('、')
                            : t('event.teams.noRoster')}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </PagePanelBody>
            </PagePanel>
          )}

          <Tour
            tourId={TOUR_IDS.eventAdmin}
            steps={EVENT_ADMIN_TOUR_STEPS}
            open={tour.open}
            onClose={tour.close}
          />

          <ConfirmDangerDialog
            open={finishOpen}
            onOpenChange={setFinishOpen}
            title={t('event.finish.title')}
            description={t('event.finish.desc')}
            confirmLabel={t('event.finish.confirm')}
            processingLabel={t('event.finish.processing')}
            processing={finishing}
            onConfirm={() => void confirmFinish()}
          />

          <ConfirmDangerDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title={t('event.delete.title')}
            description={t('event.delete.desc')}
            confirmLabel={t('event.delete.confirm')}
            processingLabel={t('event.delete.processing')}
            processing={deleting}
            onConfirm={() => void confirmDeleteEvent()}
          />

          <ConfirmDangerDialog
            open={Boolean(deleteGameId)}
            onOpenChange={(open) => !open && setDeleteGameId(null)}
            title={t('game.delete.title')}
            description={t('game.delete.desc')}
            confirmLabel={t('game.delete.confirm')}
            processingLabel={t('game.delete.processing')}
            processing={deletingGame}
            onConfirm={() => void confirmDeleteGame()}
          />
        </div>
      )}
    </PageShell>
  );
}
