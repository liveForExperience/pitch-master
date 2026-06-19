export type GameEventType =
  | 'GOAL'
  | 'OWN_GOAL'
  | 'ASSIST'
  | 'UNDO'
  | 'PAUSE'
  | 'RESUME'
  | 'START'
  | 'FINISH';

export type TeamSide = 'A' | 'B';

export type GameStatus = 'READY' | 'PLAYING' | 'PAUSED' | 'FINISHED';

export type ScoreEvent = {
  id: string;
  type: GameEventType;
  teamSide: TeamSide | null;
  undoTargetEventId: string | null;
};

export type TimerGame = {
  status: GameStatus;
  startedAt: number | null;
  finishedAt: number | null;
  pausedDurationMs: number;
  pauseStartedAt: number | null;
  plannedDurationMs: number;
};
