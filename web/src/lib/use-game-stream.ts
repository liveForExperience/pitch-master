import { useEffect } from 'react';

/** 订阅比赛 SSE：比分/状态变更与计时校准 */
export function useGameStream(gameId: string, onUpdate: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled || !gameId) return;
    const es = new EventSource(`/api/games/${gameId}/stream`);
    es.addEventListener('game_update', onUpdate);
    es.addEventListener('timer_tick', onUpdate);
    return () => es.close();
  }, [gameId, onUpdate, enabled]);
}
