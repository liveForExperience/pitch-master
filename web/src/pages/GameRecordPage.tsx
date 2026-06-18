import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  fetchGame,
  fetchServerTime,
  finishGame,
  pauseGame,
  recordGoal,
  resumeGame,
  startGame,
  undoEvent,
} from '../api/events';
import { newClientEventId } from '../api/client';
import type { GameDetail } from '../api/types';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { formatMs } from '../lib/time-format';
import { getAdminToken } from '../lib/storage';
import { useSessionStore } from '../stores/session';

export function GameRecordPage() {
  const { id = '' } = useParams();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');
  const [pickSide, setPickSide] = useState<'A' | 'B' | null>(null);

  const recentEvents = useSessionStore((s) => s.recentEvents);
  const token = game ? getAdminToken(game.game.eventId) : null;
  const eventShortCode = game
    ? recentEvents.find((e) => e.id === game.game.eventId)?.shortCode
    : undefined;

  const reload = useCallback(async () => {
    const detail = await fetchGame(id);
    setGame(detail);
  }, [id]);

  useEffect(() => {
    fetchServerTime()
      .then(({ serverNow }) => setServerOffset(serverNow - Date.now()))
      .catch(() => undefined);
    void reload().catch((err: Error) => setError(err.message));
  }, [reload]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const es = new EventSource(`/api/games/${id}/stream`);
    es.addEventListener('game_update', () => {
      void reload();
    });
    es.addEventListener('timer_tick', () => {
      void reload();
    });
    return () => es.close();
  }, [id, reload]);

  const timer = useMemo(() => {
    if (!game) return null;
    const serverNow = now + serverOffset;
    const g = game.game;
    if (!g.startedAt) return { elapsedMs: 0, remainingMs: g.plannedDurationMs, status: g.status };
    let paused = g.pausedDurationMs;
    if (g.pauseStartedAt) paused += serverNow - g.pauseStartedAt;
    const elapsedMs = Math.max(0, serverNow - g.startedAt - paused);
    return {
      elapsedMs,
      remainingMs: Math.max(0, g.plannedDurationMs - elapsedMs),
      status: g.status,
    };
  }, [game, now, serverOffset]);

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
    await reload();
  };

  const onGoal = async (side: 'A' | 'B', rosterId: string) => {
    if (!token) return;
    await recordGoal(
      id,
      { clientEventId: newClientEventId(), teamSide: side, scorerRosterId: rosterId, clientTs: Date.now() + serverOffset },
      token,
    );
    setPickSide(null);
    await reload();
  };

  const onUndoLast = async () => {
    if (!token || !game) return;
    const scorable = [...game.events].reverse().find((e) => e.type === 'GOAL' || e.type === 'OWN_GOAL');
    if (!scorable) return;
    await undoEvent(id, scorable.id, token);
    await reload();
  };

  if (!game) {
    return (
      <PageShell title="录入" backTo="/">
        {error ? <p className="text-sm text-danger">{error}</p> : <p className="text-sm text-textSec">加载中…</p>}
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`${game.teamA?.name} vs ${game.teamB?.name}`}
      backTo={eventShortCode ? `/events/${eventShortCode}` : '/'}
    >
      <Card className="text-center">
        <div className="font-score tabular-nums text-score text-textPri">
          {game.scoreA} : {game.scoreB}
        </div>
        <p className="mt-2 text-sm text-textSec">
          {timer ? `${formatMs(timer.elapsedMs)} · 剩 ${formatMs(timer.remainingMs)} · ${timer.status}` : ''}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        {game.game.status === 'READY' && (
          <PrimaryButton className="col-span-2" onClick={() => void onStart()}>
            开始比赛
          </PrimaryButton>
        )}
        {(game.game.status === 'PLAYING' || game.game.status === 'PAUSED') && (
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

      <div className="grid grid-cols-2 gap-3">
        <PrimaryButton onClick={() => setPickSide('A')}>A 队进球</PrimaryButton>
        <PrimaryButton onClick={() => setPickSide('B')}>B 队进球</PrimaryButton>
      </div>

      {pickSide && (
        <Card>
          <p className="mb-2 text-sm text-textSec">选择进球球员 ({pickSide} 队)</p>
          <div className="grid grid-cols-2 gap-2">
            {rosterForSide(pickSide).map((p) => (
              <button
                key={p.id}
                type="button"
                className="min-h-14 rounded-xl bg-chipBg px-2 py-2 text-sm font-semibold"
                onClick={() => void onGoal(pickSide, p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      <PrimaryButton className="bg-danger" onClick={() => void onUndoLast()}>
        撤销最近进球
      </PrimaryButton>

      <Link to={`/games/${id}`} className="block text-center text-sm text-primary">
        查看详情
      </Link>
    </PageShell>
  );
}
