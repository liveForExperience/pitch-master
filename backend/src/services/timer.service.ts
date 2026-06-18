import type { TimerGame } from '../types/domain.js';

export function deriveElapsedMs(game: TimerGame, nowMs: number): number {
  if (!game.startedAt) return 0;
  let pausedExtra = game.pausedDurationMs;
  if (game.pauseStartedAt != null) {
    pausedExtra += nowMs - game.pauseStartedAt;
  }
  return Math.max(0, nowMs - game.startedAt - pausedExtra);
}

export function deriveRemainingMs(game: TimerGame, nowMs: number): number {
  const elapsed = deriveElapsedMs(game, nowMs);
  return Math.max(0, game.plannedDurationMs - elapsed);
}

export type TimerState = {
  status: TimerGame['status'];
  elapsedMs: number;
  remainingMs: number;
  plannedDurationMs: number;
};

export function buildTimerState(game: TimerGame, nowMs: number): TimerState {
  return {
    status: game.status,
    elapsedMs: deriveElapsedMs(game, nowMs),
    remainingMs: deriveRemainingMs(game, nowMs),
    plannedDurationMs: game.plannedDurationMs,
  };
}
