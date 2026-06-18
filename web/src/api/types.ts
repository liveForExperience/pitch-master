export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: { code: string; message: string } };

export type CreatedEvent = {
  id: string;
  shortCode: string;
  adminToken: string;
  pin: string;
  createdAt: number;
};

export type RosterMember = { id: string; name: string; jerseyNumber: number | null };
export type Team = {
  id: string;
  name: string;
  colorHex: string;
  roster: RosterMember[];
};

export type GameSummary = {
  id: string;
  teamAId: string;
  teamBId: string;
  status: string;
  startedAt: number | null;
  finishedAt: number | null;
  plannedDurationMs: number;
};

export type EventDetail = {
  id: string;
  shortCode: string;
  name: string;
  status: string;
  createdAt: number;
  finishedAt: number | null;
  teams: Team[];
  games: GameSummary[];
};

export type TimerState = {
  status: string;
  elapsedMs: number;
  remainingMs: number;
  plannedDurationMs: number;
};

export type GameDetail = {
  game: GameSummary & {
    eventId: string;
    pausedDurationMs: number;
    pauseStartedAt: number | null;
  };
  teamA: Team | undefined;
  teamB: Team | undefined;
  events: Array<{
    id: string;
    type: string;
    teamSide: string | null;
    scorerRosterId: string | null;
    assistantRosterId: string | null;
    serverTs: number;
  }>;
  scoreA: number;
  scoreB: number;
  timer: TimerState;
};
