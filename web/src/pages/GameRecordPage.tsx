import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Warning } from '@phosphor-icons/react';
import { newClientEventId } from '../api/client';
import {
  fetchGame,
  finishGame,
  pauseGame,
  resumeGame,
  startGame,
} from '../api/events';
import { ApiError } from '../api/parse-response';
import type { GameDetail } from '../api/types';
import { GameEventFeed } from '../components/GameEventFeed';
import { EditorLeaseBanner } from '../components/EditorLeaseBanner';
import { GoalPickPanel, type PickPhase } from '../components/GoalPickPanel';
import { PageShell, PrimaryButton } from '../components/ui/layout';
import { useT } from '../i18n';
import { reconcileGameWithOutbox, isServerConfirmedEvent } from '../lib/outbox/reconcile-game';
import { resolveUndoTarget } from '../lib/outbox/merge-game';
import { getOrCreateDeviceId } from '../lib/device-id';
import { formatMs } from '../lib/time-format';
import { useEditorLease } from '../lib/use-editor-lease';
import { useGameStream } from '../lib/use-game-stream';
import { useLiveGameTimer, useServerOffset } from '../lib/use-live-game-timer';
import { getAdminToken } from '../lib/storage';
import { useOutboxStore } from '../stores/outbox';
import { useSessionStore } from '../stores/session';

type EditingGoal = { eventId: string; side: 'A' | 'B' };

function ScoreDiffChip({ diff }: { diff: number }) {
  if (diff === 0) return null;
  const positive = diff > 0;
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-2.5 font-mono text-xs font-medium tabular-nums ${
        positive ? 'bg-primaryPale text-primary' : 'bg-danger/10 text-danger'
      }`}
    >
      {positive ? `+${diff}` : String(diff)}
    </span>
  );
}

function RecordScoreHero({
  game,
  timer,
}: {
  game: GameDetail;
  timer: ReturnType<typeof useLiveGameTimer>;
}) {
  const t = useT();
  const teamA = game.teamA ?? { name: 'A', colorHex: '#64748b' };
  const teamB = game.teamB ?? { name: 'B', colorHex: '#64748b' };
  const diff = game.scoreA - game.scoreB;
  const finished = game.game.status === 'FINISHED';

  const statusLine = finished
    ? `${t('record.statusFinished').toUpperCase()} · ${formatMs(timer?.elapsedMs ?? 0)}`
    : timer
      ? `${formatMs(timer.elapsedMs)} · ${formatMs(timer.remainingMs)} ${t('record.statusLeft').toUpperCase()} · ${timer.status.toUpperCase()}`
      : game.game.status.toUpperCase();

  return (
    <header className="flex min-h-[50vh] flex-col justify-center py-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className="h-10 w-1.5 shrink-0 rounded-sm"
            style={{ backgroundColor: teamA.colorHex }}
          />
          <span className="truncate text-body font-bold text-textPri">{teamA.name}</span>
          <ScoreDiffChip diff={diff} />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <ScoreDiffChip diff={-diff} />
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

      <p className="text-center font-mono text-[11px] uppercase tracking-[0.14em] text-textSec">
        {statusLine}
      </p>
    </header>
  );
}

export function GameRecordPage() {
  const t = useT();
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [serverGame, setServerGame] = useState<GameDetail | null>(null);
  const [error, setError] = useState('');
  const [pick, setPick] = useState<PickPhase>(null);
  const [editing, setEditing] = useState<EditingGoal | null>(null);

  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  const outboxItems = useOutboxStore((s) => s.items);
  const enqueue = useOutboxStore((s) => s.enqueue);
  const pendingForGame = useMemo(
    () => outboxItems.filter((i) => i.gameId === id),
    [outboxItems, id],
  );
  const game = useMemo(
    () => (serverGame ? reconcileGameWithOutbox(serverGame, pendingForGame) : null),
    [serverGame, pendingForGame],
  );

  const recentEvents = useSessionStore((s) => s.recentEvents);
  const token = game ? getAdminToken(game.game.eventId) : null;
  const {
    editor,
    canControlTimer,
    busy: leaseBusy,
    claim,
    release,
    syncFromDetail,
  } = useEditorLease(id, token, Boolean(token));
  const canRecordGoals = Boolean(token);

  const eventShortCode =
    game?.eventShortCode ??
    recentEvents.find((e) => e.id === game?.game.eventId)?.shortCode;

  const reload = useCallback(async () => {
    const detail = await fetchGame(id, deviceId);
    setServerGame(detail);
    syncFromDetail(detail.editor);
  }, [id, deviceId, syncFromDetail]);

  useEffect(() => {
    if (game && !getAdminToken(game.game.eventId)) {
      nav(`/games/${id}`, { replace: true });
    }
  }, [game, id, nav]);

  useEffect(() => {
    void reload().catch((err: Error) => setError(err.message));
  }, [reload]);

  useGameStream(id, () => void reload(), Boolean(serverGame), () => void reload());

  const timer = useLiveGameTimer(game);
  const serverOffset = useServerOffset();

  const rosterForSide = (side: 'A' | 'B') => {
    if (!game) return [];
    const team = side === 'A' ? game.teamA : game.teamB;
    return team?.roster ?? [];
  };

  const runTimerAction = async (action: () => Promise<unknown>) => {
    if (!token || !serverGame || !canControlTimer) return;
    try {
      await action();
      await reload();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'version_conflict') {
        await reload();
        return;
      }
      setError(err instanceof Error ? err.message : t('common.error.generic'));
    }
  };

  const onStart = () =>
    void runTimerAction(() =>
      startGame(id, token!, { deviceId, version: serverGame!.game.version }),
    );

  const onPauseResume = () => {
    if (!game) return;
    void runTimerAction(() =>
      game.game.status === 'PLAYING'
        ? pauseGame(id, token!, { deviceId, version: serverGame!.game.version })
        : resumeGame(id, token!, { deviceId, version: serverGame!.game.version }),
    );
  };

  const onFinish = () =>
    void runTimerAction(async () => {
      await finishGame(id, token!, { deviceId, version: serverGame!.game.version });
      setPick(null);
    });

  const onClaimLease = () => void claim(false).then(() => reload());
  const onForceLease = () => {
    if (!window.confirm(t('record.editor.forceConfirm'))) return;
    void claim(true).then(() => reload());
  };
  const onReleaseLease = () => void release().then(() => reload());

  const submitGoal = async (side: 'A' | 'B', scorerId: string, assistantId?: string) => {
    if (!token || !serverGame || !canRecordGoals) return;
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

  const onDeleteGoal = async (eventId: string) => {
    if (!token || !serverGame || !canRecordGoals) return;
    if (
      !isServerConfirmedEvent(eventId, serverGame.events) &&
      !pendingForGame.some((i) => i.payload.clientEventId === eventId)
    ) {
      return;
    }
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
    if (
      !isServerConfirmedEvent(event.id, serverGame?.events ?? []) &&
      !pendingForGame.some((i) => i.payload.clientEventId === event.id)
    ) {
      return;
    }
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
        <p className="text-sm text-textSec">{t('common.redirecting')}</p>
      </PageShell>
    );
  }

  const finished = game.game.status === 'FINISHED';
  const inProgress = game.game.status === 'PLAYING' || game.game.status === 'PAUSED';
  const hasPending = pendingForGame.length > 0;

  return (
    <PageShell
      title={`${game.teamA?.name} vs ${game.teamB?.name}`}
      backTo={eventShortCode ? `/events/${eventShortCode}` : '/'}
    >
      {error && <p className="text-sm text-danger">{error}</p>}
      <EditorLeaseBanner
        editor={editor}
        myDeviceId={deviceId}
        busy={leaseBusy}
        canControlTimer={canControlTimer}
        onClaim={() => void onClaimLease()}
        onForce={onForceLease}
        onRelease={() => void onReleaseLease()}
      />
      {hasPending && (
        <p className="text-xs text-warning">
          {t('record.pending', { count: pendingForGame.length })}
        </p>
      )}

      <RecordScoreHero game={game} timer={timer} />

      <div className="grid grid-cols-2 gap-2">
        {game.game.status === 'READY' && (
          <PrimaryButton
            className="col-span-2"
            disabled={!canControlTimer}
            onClick={onStart}
          >
            {t('record.start')}
          </PrimaryButton>
        )}
        {inProgress && (
          <>
            <PrimaryButton disabled={!canControlTimer} onClick={onPauseResume}>
              {game.game.status === 'PLAYING' ? t('record.pause') : t('record.resume')}
            </PrimaryButton>
            <PrimaryButton
              className="bg-warning"
              disabled={!canControlTimer}
              onClick={onFinish}
            >
              {t('record.finish')}
            </PrimaryButton>
          </>
        )}
      </div>

      {finished && (
        <div className="flex items-start gap-3 border-y border-border py-4">
          <Warning className="mt-0.5 shrink-0 text-warning" size={20} weight="duotone" />
          <div>
            <p className="text-sm font-medium text-textPri">{t('record.postEdit.title')}</p>
            <p className="mt-1 text-xs text-textSec">{t('record.postEdit.body')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <PrimaryButton disabled={!canRecordGoals} onClick={() => setPick({ side: 'A' })}>
          {finished
            ? t('record.goalAFix', { name: game.teamA?.name ?? 'A' })
            : t('record.goalA')}
        </PrimaryButton>
        <PrimaryButton disabled={!canRecordGoals} onClick={() => setPick({ side: 'B' })}>
          {finished
            ? t('record.goalAFix', { name: game.teamB?.name ?? 'B' })
            : t('record.goalB')}
        </PrimaryButton>
      </div>

      <GoalPickPanel
        pick={pick}
        editing={Boolean(editing)}
        rosterForSide={rosterForSide}
        onPickScorer={(side, scorerId, scorerName) =>
          setPick({ side, scorerId, scorerName })
        }
        onSubmitGoal={(side, scorerId, assistantId) => void submitGoal(side, scorerId, assistantId)}
        onCancel={cancelPick}
        onBackToScorerList={(side) => setPick({ side })}
      />

      <section className="border-t border-border pt-4">
        <p className="mb-3 text-xs text-textSec">{t('record.feedHint')}</p>
        <GameEventFeed
          game={game}
          scorableOnly
          editable={canRecordGoals}
          onDelete={(e) => void onDeleteGoal(e.id)}
          onEdit={onEditGoal}
        />
      </section>

      <Link to={`/games/${id}`} className="block border-t border-border pt-4 text-center text-sm text-primary">
        {t('record.viewDetail')}
      </Link>
    </PageShell>
  );
}
