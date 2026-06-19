import { useEffect, useMemo, useState } from 'react';
import { fetchServerTime } from '../api/events';
import type { GameDetail } from '../api/types';

export type LiveTimer = {
  elapsedMs: number;
  remainingMs: number;
  plannedDurationMs: number;
  status: string;
};

/** 与服务端时钟的偏移量（ms），用于 clientTs 等写入 */
export function useServerOffset(): number {
  const [serverOffset, setServerOffset] = useState(0);

  useEffect(() => {
    fetchServerTime()
      .then(({ serverNow }) => setServerOffset(serverNow - Date.now()))
      .catch(() => undefined);
  }, []);

  return serverOffset;
}

/** 基于服务端时钟偏移，本地平滑推算比赛计时（观众页与录入页共用） */
export function useLiveGameTimer(game: GameDetail | null): LiveTimer | null {
  const serverOffset = useServerOffset();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (game?.game.status === 'FINISHED') return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [game?.game.status]);

  return useMemo(() => {
    if (!game) return null;
    const g = game.game;
    if (g.status === 'FINISHED') {
      return {
        elapsedMs: game.timer.elapsedMs,
        remainingMs: game.timer.remainingMs,
        plannedDurationMs: g.plannedDurationMs,
        status: g.status,
      };
    }
    const serverNow = now + serverOffset;
    if (!g.startedAt) {
      return {
        elapsedMs: 0,
        remainingMs: g.plannedDurationMs,
        plannedDurationMs: g.plannedDurationMs,
        status: g.status,
      };
    }
    let paused = g.pausedDurationMs;
    if (g.pauseStartedAt) paused += serverNow - g.pauseStartedAt;
    const elapsedMs = Math.max(0, serverNow - g.startedAt - paused);
    return {
      elapsedMs,
      remainingMs: Math.max(0, g.plannedDurationMs - elapsedMs),
      plannedDurationMs: g.plannedDurationMs,
      status: g.status,
    };
  }, [game, now, serverOffset]);
}
