import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  fetchGame,
  finishGame,
  pauseGame,
  recordGoal,
  resumeGame,
  startGame,
  undoEvent,
} from '../api/events';
import { newClientEventId } from '../api/client';
import type { GameDetail } from '../api/types';
import { GameEventFeed } from '../components/GameEventFeed';
import { GoalPickPanel, type PickPhase } from '../components/GoalPickPanel';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { formatMs } from '../lib/time-format';
import { useGameStream } from '../lib/use-game-stream';
import { useLiveGameTimer, useServerOffset } from '../lib/use-live-game-timer';
import { getAdminToken } from '../lib/storage';
import { useSessionStore } from '../stores/session';

type EditingGoal = { eventId: string; side: 'A' | 'B' };

export function GameRecordPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [error, setError] = useState('');
  const [pick, setPick] = useState<PickPhase>(null);
  const [editing, setEditing] = useState<EditingGoal | null>(null);

  const recentEvents = useSessionStore((s) => s.recentEvents);
  const token = game ? getAdminToken(game.game.eventId) : null;
  const eventShortCode =
    game?.eventShortCode ??
    recentEvents.find((e) => e.id === game?.game.eventId)?.shortCode;

  const reload = useCallback(async () => {
    const detail = await fetchGame(id);
    setGame(detail);
  }, [id]);

  useEffect(() => {
    if (game && !getAdminToken(game.game.eventId)) {
      nav(`/games/${id}`, { replace: true });
    }
  }, [game, id, nav]);

  useEffect(() => {
    void reload().catch((err: Error) => setError(err.message));
  }, [reload]);

  useGameStream(id, () => void reload(), Boolean(game));

  const timer = useLiveGameTimer(game);
  const serverOffset = useServerOffset();

  const rosterForSide = (side: 'A' | 'B') => {
    if (!game) return [];
    const team = side === 'A' ? game.teamA : game.teamB;
    return team?.roster ?? [];
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
    if (!token) return;
    try {
      if (editing) {
        await undoEvent(id, editing.eventId, token);
        setEditing(null);
      }
      await recordGoal(
        id,
        {
          clientEventId: newClientEventId(),
          teamSide: side,
          scorerRosterId: scorerId,
          assistantRosterId: assistantId,
          clientTs: Date.now() + serverOffset,
        },
        token,
      );
      setPick(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const onDeleteGoal = async (eventId: string) => {
    if (!token) return;
    try {
      await undoEvent(id, eventId, token);
      if (editing?.eventId === eventId) {
        setEditing(null);
        setPick(null);
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
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
      <PageShell title="录入" backTo="/">
        {error ? <p className="text-sm text-danger">{error}</p> : <p className="text-sm text-textSec">加载中…</p>}
      </PageShell>
    );
  }

  if (!token) {
    return (
      <PageShell title="录入" backTo={eventShortCode ? `/events/${eventShortCode}` : '/'}>
        <p className="text-sm text-textSec">正在跳转…</p>
      </PageShell>
    );
  }

  const finished = game.game.status === 'FINISHED';
  const inProgress = game.game.status === 'PLAYING' || game.game.status === 'PAUSED';

  return (
    <PageShell
      title={`${game.teamA?.name} vs ${game.teamB?.name}`}
      backTo={eventShortCode ? `/events/${eventShortCode}` : '/'}
    >
      {error && <p className="text-sm text-danger">{error}</p>}
      <Card className="text-center">
        <div className="font-score tabular-nums text-score text-textPri">
          {game.scoreA} : {game.scoreB}
        </div>
        <p className="mt-2 text-sm text-textSec">
          {finished
            ? `已结束 · 用时 ${formatMs(timer?.elapsedMs ?? 0)}`
            : timer
              ? `${formatMs(timer.elapsedMs)} · 剩 ${formatMs(timer.remainingMs)} · ${timer.status}`
              : ''}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        {game.game.status === 'READY' && (
          <PrimaryButton className="col-span-2" onClick={() => void onStart()}>
            开始比赛
          </PrimaryButton>
        )}
        {inProgress && (
          <>
            <PrimaryButton onClick={() => void onPauseResume()}>
              {game.game.status === 'PLAYING' ? '暂停' : '继续'}
            </PrimaryButton>
            <PrimaryButton className="bg-warning" onClick={() => void onFinish()}>
              结束
            </PrimaryButton>
          </>
        )}
      </div>

      {finished && (
        <Card className="border-warning/30 bg-warning/5">
          <p className="text-sm font-medium text-textPri">赛后修正</p>
          <p className="mt-1 text-xs text-textSec">
            比赛已结束，可补录进球，或在事件流中修改/删除任意一条记录。
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <PrimaryButton onClick={() => setPick({ side: 'A' })}>
          {finished ? `${game.teamA?.name ?? 'A'} 补录` : 'A 队进球'}
        </PrimaryButton>
        <PrimaryButton onClick={() => setPick({ side: 'B' })}>
          {finished ? `${game.teamB?.name ?? 'B'} 补录` : 'B 队进球'}
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

      <Card>
        <h2 className="mb-2 font-semibold">事件流</h2>
        <p className="mb-3 text-xs text-textSec">点击「修改」或「删除」可调整任意一条进球记录</p>
        <GameEventFeed
          game={game}
          scorableOnly
          editable
          onDelete={(e) => void onDeleteGoal(e.id)}
          onEdit={onEditGoal}
        />
      </Card>

      <Link to={`/games/${id}`} className="block text-center text-sm text-primary">
        查看详情（只读链接可分享）
      </Link>
    </PageShell>
  );
}
