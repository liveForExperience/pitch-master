import { useEffect } from 'react';

/** 订阅比赛 SSE：比分/状态变更、计时校准、录入权变更 */
export function useGameStream(
  gameId: string,
  onUpdate: () => void,
  enabled = true,
  onEditorChanged?: () => void,
) {
  useEffect(() => {
    if (!enabled || !gameId) return;
    const es = new EventSource(`/api/games/${gameId}/stream`);
    es.addEventListener('game_update', onUpdate);
    es.addEventListener('timer_tick', onUpdate);
    if (onEditorChanged) {
      es.addEventListener('editor_changed', onEditorChanged);
    }
    return () => es.close();
  }, [gameId, onUpdate, onEditorChanged, enabled]);
}
