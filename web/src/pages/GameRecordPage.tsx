import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Warning } from '@phosphor-icons/react';
import { newClientEventId } from '../api/client';
import {
  fetchGame,
  finishGame,
  pauseGame,
  resumeGame,
  startGame,
} from '../api/events';
import type { GameDetail } from '../api/types';
import { GameEventFeed } from '../components/GameEventFeed';
import { GoalPickPanel, type PickPhase } from '../components/GoalPickPanel';
import { ShootoutPanel } from '../components/ShootoutPanel';
import { InlineAlert } from '../components/ui/inline-alert';
import { PagePanel, PagePanelBody, PagePanelHeader } from '../components/ui/page-panel';
import { Tour } from '../components/tour/Tour';
import { RECORD_TOUR_STEPS, TOUR_IDS } from '../components/tour/tour-config';
import { usePageTour } from '../components/tour/use-page-tour';
import { useT } from '../i18n';
import { PageShell, PrimaryButton } from '../components/ui/layout';
import { deriveShootoutView } from '../lib/game-events';
import { mergeGameWithOutbox, resolveUndoTarget } from '../lib/outbox/merge-game';
import { formatShootoutBadge } from '../lib/report-display';
import { formatMs } from '../lib/time-format';
import { useGameStream } from '../lib/use-game-stream';
import { useLiveGameTimer, useServerOffset } from '../lib/use-live-game-timer';
import { getAdminToken } from '../lib/storage';
import { useRequireAdmin } from '../lib/use-require-admin';
import { useOutboxStore } from '../stores/outbox';
import { useSessionStore } from '../stores/session';

type EditingGoal = { eventId: string; side: 'A' | 'B' };

function RecordScoreHero({
  game,
  timer,
  shootoutSummary,
}: {
  game: GameDetail;
  timer: ReturnType<typeof useLiveGameTimer>;
  shootoutSummary: {
    madeA: number;
    madeB: number;
    winner: 'A' | 'B' | null;
    ended: boolean;
  } | null;
}) {
  const t = useT();
  const teamA = game.teamA ?? { name: 'A', colorHex: '#64748b' };
  const teamB = game.teamB ?? { name: 'B', colorHex: '#64748b' };
  const finished = game.game.status === 'FINISHED';

  const shootoutBadge = formatShootoutBadge(shootoutSummary, t);

  const statusLine = finished
    ? `${t('record.statusFinished').toUpperCase()} · ${formatMs(timer?.elapsedMs ?? 0)}`
    : timer
      ? `${formatMs(timer.elapsedMs)} · ${formatMs(timer.remainingMs)} ${t('record.statusLeft').toUpperCase()} · ${timer.status.toUpperCase()}`
      : game.game.status.toUpperCase();

  return (
    <header data-tour="record-clock" className="flex min-h-[50vh] flex-col justify-center py-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className="h-10 w-1.5 shrink-0 rounded-sm"
            style={{ backgroundColor: teamA.colorHex }}
          />
          <span className="truncate text-body font-bold text-textPri">{teamA.name}</span>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-body font-bold text-textPri">{teamB.name}</span>
          <span
            className="h-10 w-1.5 shrink-0 rounded-sm"
            style={{ backgroundColor: teamB.colorHex }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-6 font-mono tabular-nums tracking-[-0.04em]">
        <span className="text-[168px] leading-none text-textPri">{game.scoreA}</span>
        <span className="text-[72px] leading-none text-textSec">:</span>
        <span className="text-[168px] leading-none text-textPri">{game.scoreB}</span>
      </div>

      {shootoutBadge && (
        <p className="mb-2 text-center font-mono text-[13px] font-semibold uppercase tracking-[0.18em] text-textSec">
          {shootoutBadge}
        </p>
      )}

      <p className="text-center font-mono text-[11px] uppercase tracking-[0.14em] text-textSec">
        {statusLine}
      </p>
    </header>
  );
}

export function GameRecordPage() {
  const t = useT();
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const shortCodeFromUrl = searchParams.get('shortCode') ?? '';
  const eventIdFromUrl = searchParams.get('eventId') ?? '';
  const [serverGame, setServerGame] = useState<GameDetail | null>(null);
  const [error, setError] = useState('');
  const [pick, setPick] = useState<PickPhase>(null);
  const [editing, setEditing] = useState<EditingGoal | null>(null);
  const [shootoutOpen, setShootoutOpen] = useState(false);

  const outboxItems = useOutboxStore((s) => s.items);
  const enqueue = useOutboxStore((s) => s.enqueue);
  const pendingForGame = useMemo(
    () => outboxItems.filter((i) => i.gameId === id),
    [outboxItems, id],
  );
  const game = useMemo(
    () => (serverGame ? mergeGameWithOutbox(serverGame, pendingForGame) : null),
    [serverGame, pendingForGame],
  );

  const recentEvents = useSessionStore((s) => s.recentEvents);
  const eventId = game?.game.eventId ?? (eventIdFromUrl || undefined);
  const eventShortCode =
    game?.eventShortCode ??
    (shortCodeFromUrl || (recentEvents.find((e) => e.id === eventId)?.shortCode ?? ''));

  const { canWrite, loading: adminLoading } = useRequireAdmin(
    eventShortCode,
    eventId,
    eventShortCode ? `/events/${eventShortCode}` : `/games/${id}`,
  );
  const token = canWrite && eventId ? getAdminToken(eventId) : null;

  const reload = useCallback(async () => {
    const detail = await fetchGame(id);
    setServerGame(detail);
  }, [id]);

  useEffect(() => {
    void reload().catch((err: Error) => setError(err.message));
  }, [reload]);

  useGameStream(id, () => void reload(), Boolean(serverGame));

  const timer = useLiveGameTimer(game);
  const serverOffset = useServerOffset();

  const tour = usePageTour(TOUR_IDS.record, {
    ready: Boolean(game) && Boolean(token),
  });

  const rosterForSide = (side: 'A' | 'B') => {
    if (!game) return [];
    const team = side === 'A' ? game.teamA : game.teamB;
    return team?.roster ?? [];
  };

  const teamNameForSide = (side: 'A' | 'B') => {
    if (!game) return side;
    const team = side === 'A' ? game.teamA : game.teamB;
    return team?.name ?? side;
  };

  const onStart = async () => {
    if (!token) return;
    await startGame(id, token);
    await reload();
  };

  const onPauseResume = async () => {
    if (!token || !game) return;
    if (game.game.status === 'PLAYING') await pauseGame(id, token);
    else if (game.game.status === 'PAUSED') await resumeGame(id, token);
    await reload();
  };

  const onFinish = async () => {
    if (!token) return;
    await finishGame(id, token);
    setPick(null);
    await reload();
  };

  const submitGoal = async (side: 'A' | 'B', scorerId: string, assistantId?: string) => {
    if (!token || !serverGame) return;
    const clientTs = Date.now() + serverOffset;
    try {
      if (editing) {
        const undoTarget = resolveUndoTarget(
          editing.eventId,
          serverGame.events,
          pendingForGame,
        );
        await enqueue(
          id,
          serverGame.game.eventId,
          {
            clientEventId: newClientEventId(),
            type: 'UNDO',
            ...undoTarget,
          },
          clientTs - 1,
        );
        setEditing(null);
      }
      await enqueue(
        id,
        serverGame.game.eventId,
        {
          clientEventId: newClientEventId(),
          type: 'GOAL',
          teamSide: side,
          scorerRosterId: scorerId,
          assistantRosterId: assistantId,
        },
        clientTs,
      );
      setPick(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error.generic'));
    }
  };

  /**
   * `side` = the team that receives the point (the panel the admin opened).
   * The DB event has `teamSide` = opposite of `side` because that side is
   * the team who scored into their own net. `scorerRosterId` is the
   * offending player on the opposing team (optional; may be unknown).
   */
  const submitOwnGoal = async (side: 'A' | 'B', scorerRosterId?: string) => {
    if (!token || !serverGame) return;
    const clientTs = Date.now() + serverOffset;
    const guiltyTeam: 'A' | 'B' = side === 'A' ? 'B' : 'A';
    try {
      await enqueue(
        id,
        serverGame.game.eventId,
        {
          clientEventId: newClientEventId(),
          type: 'OWN_GOAL',
          teamSide: guiltyTeam,
          scorerRosterId,
        },
        clientTs,
      );
      setPick(null);
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error.generic'));
    }
  };

  const submitPenaltyKick = async (
    side: 'A' | 'B',
    scorerRosterId: string,
    made: boolean,
  ) => {
    if (!token || !serverGame) return;
    try {
      await enqueue(
        id,
        serverGame.game.eventId,
        {
          clientEventId: newClientEventId(),
          type: made ? 'PENALTY_MADE' : 'PENALTY_MISSED',
          teamSide: side,
          scorerRosterId,
        },
        Date.now() + serverOffset,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error.generic'));
    }
  };

  const submitShootoutEnd = async () => {
    if (!token || !serverGame) return;
    try {
      await enqueue(
        id,
        serverGame.game.eventId,
        {
          clientEventId: newClientEventId(),
          type: 'SHOOTOUT_END',
        },
        Date.now() + serverOffset,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error.generic'));
    }
  };

  const submitReopenShootout = async (endEventId: string) => {
    if (!token || !serverGame) return;
    try {
      const undoTarget = resolveUndoTarget(endEventId, serverGame.events, pendingForGame);
      await enqueue(
        id,
        serverGame.game.eventId,
        {
          clientEventId: newClientEventId(),
          type: 'UNDO',
          ...undoTarget,
        },
        Date.now() + serverOffset,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error.generic'));
    }
  };

  const onDeleteGoal = async (eventId: string) => {
    if (!token || !serverGame) return;
    try {
      const undoTarget = resolveUndoTarget(eventId, serverGame.events, pendingForGame);
      await enqueue(
        id,
        serverGame.game.eventId,
        {
          clientEventId: newClientEventId(),
          type: 'UNDO',
          ...undoTarget,
        },
        Date.now() + serverOffset,
      );
      if (editing?.eventId === eventId) {
        setEditing(null);
        setPick(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('record.error.delete'));
    }
  };

  const onEditGoal = (event: GameDetail['events'][number]) => {
    if (event.teamSide !== 'A' && event.teamSide !== 'B') return;
    setEditing({ eventId: event.id, side: event.teamSide });
    setPick({ side: event.teamSide });
  };

  const cancelPick = () => {
    setPick(null);
    setEditing(null);
  };

  if (!game) {
    return (
      <PageShell title={t('record.title')} backTo="/">
        {error ? <p className="text-sm text-danger">{error}</p> : <p className="text-sm text-textSec">{t('common.loading')}</p>}
      </PageShell>
    );
  }

  if (!token) {
    return (
      <PageShell title={t('record.title')} backTo={eventShortCode ? `/events/${eventShortCode}` : '/'}>
        <p className="text-sm text-textSec">
          {adminLoading ? t('common.loading') : t('common.redirecting')}
        </p>
      </PageShell>
    );
  }

  const finished = game.game.status === 'FINISHED';
  const inProgress = game.game.status === 'PLAYING' || game.game.status === 'PAUSED';
  const hasPending = pendingForGame.length > 0;
  const shootoutView = deriveShootoutView(game.events);
  const isDrawn = game.scoreA === game.scoreB;
  const shootoutStarted = shootoutView.kicks.length > 0;
  const showShootoutEntry = finished && isDrawn && !shootoutStarted && !shootoutOpen;
  const showShootoutPanel = finished && (shootoutStarted || shootoutOpen);

  return (
    <PageShell
      title={`${game.teamA?.name} vs ${game.teamB?.name}`}
      backTo={eventShortCode ? `/events/${eventShortCode}` : '/'}
    >
      {error && <InlineAlert>{error}</InlineAlert>}
      {hasPending && (
        <InlineAlert tone="warning">
          {t('record.pending', { count: pendingForGame.length })}
        </InlineAlert>
      )}

      <div className="space-y-4 -mt-1">
        <RecordScoreHero
          game={game}
          timer={timer}
          shootoutSummary={
            shootoutStarted
              ? {
                  madeA: shootoutView.madeA,
                  madeB: shootoutView.madeB,
                  winner: shootoutView.winner,
                  ended: shootoutView.ended,
                }
              : null
          }
        />

        {(game.game.status === 'READY' || inProgress) && (
          <PagePanel data-tour="record-controls">
            <PagePanelBody className="grid grid-cols-2 gap-2">
              {game.game.status === 'READY' && (
                <PrimaryButton className="col-span-2" onClick={() => void onStart()}>
                  {t('record.start')}
                </PrimaryButton>
              )}
              {inProgress && (
                <>
                  <PrimaryButton onClick={() => void onPauseResume()}>
                    {game.game.status === 'PLAYING' ? t('record.pause') : t('record.resume')}
                  </PrimaryButton>
                  <PrimaryButton className="bg-warning" onClick={() => void onFinish()}>
                    {t('record.finish')}
                  </PrimaryButton>
                </>
              )}
            </PagePanelBody>
          </PagePanel>
        )}

        {finished && (
          <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
            <Warning className="mt-0.5 shrink-0 text-warning" size={18} weight="bold" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-textPri">{t('record.postEdit.title')}</p>
              <p className="mt-1 text-xs leading-relaxed text-textSec">
                {t('record.postEdit.body')}
              </p>
            </div>
          </div>
        )}

        <PagePanel data-tour="record-goals">
          <PagePanelBody className="grid grid-cols-2 gap-3">
            <PrimaryButton onClick={() => setPick({ side: 'A' })}>
              {finished
                ? t('record.goalAFix', { name: game.teamA?.name ?? 'A' })
                : t('record.goalA')}
            </PrimaryButton>
            <PrimaryButton onClick={() => setPick({ side: 'B' })}>
              {finished
                ? t('record.goalAFix', { name: game.teamB?.name ?? 'B' })
                : t('record.goalB')}
            </PrimaryButton>
          </PagePanelBody>
        </PagePanel>

        <GoalPickPanel
          pick={pick}
          editing={Boolean(editing)}
          rosterForSide={rosterForSide}
          opposingRosterForSide={(side) => rosterForSide(side === 'A' ? 'B' : 'A')}
          teamNameForSide={teamNameForSide}
          onPickScorer={(side, scorerId, scorerName) =>
            setPick({ side, scorerId, scorerName })
          }
          onSubmitGoal={(side, scorerId, assistantId) =>
            void submitGoal(side, scorerId, assistantId)
          }
          onSubmitOwnGoal={(side, scorerRosterId) =>
            void submitOwnGoal(side, scorerRosterId)
          }
          onPickOwnGoal={(side) => setPick({ side, mode: 'own-goal' })}
          onCancel={cancelPick}
          onBackToScorerList={(side) => setPick({ side })}
        />

        {showShootoutEntry && (
          <PagePanel>
            <PagePanelBody className="space-y-2 text-center">
              <p className="text-sm text-textSec">{t('shootout.tiedHint')}</p>
              <PrimaryButton onClick={() => setShootoutOpen(true)}>
                {t('shootout.enter')}
              </PrimaryButton>
            </PagePanelBody>
          </PagePanel>
        )}

        {showShootoutPanel && (
          <ShootoutPanel
            game={game}
            onRecordKick={(side, scorerId, made) =>
              void submitPenaltyKick(side, scorerId, made)
            }
            onUndoKick={(eventId) => void onDeleteGoal(eventId)}
            onEndShootout={() => void submitShootoutEnd()}
            onReopenShootout={(endId) => void submitReopenShootout(endId)}
            onClose={shootoutStarted ? undefined : () => setShootoutOpen(false)}
          />
        )}

        <PagePanel data-tour="record-feed">
          <PagePanelHeader
            title={t('detail.eventStream')}
            subtitle={t('record.feedHint')}
          />
          <PagePanelBody className="py-3">
            <GameEventFeed
              game={game}
              scorableOnly
              editable
              onDelete={(e) => void onDeleteGoal(e.id)}
              onEdit={onEditGoal}
            />
          </PagePanelBody>
        </PagePanel>

        <Link
          to={`/games/${id}`}
          className="block text-center text-sm font-medium text-primary"
        >
          {t('record.viewDetail')}
        </Link>
      </div>

      <Tour
        tourId={TOUR_IDS.record}
        steps={RECORD_TOUR_STEPS}
        open={tour.open}
        onClose={tour.close}
      />
    </PageShell>
  );
}
