export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: { code: string; message: string } };

export type AdminSession = {
  eventId: string;
  role: 'viewer' | 'admin';
  tokenStatus: 'none' | 'valid' | 'invalid';
};

export type CreatedEvent = {
  id: string;
  shortCode: string;
  adminToken: string;
  pin: string;
  createdAt: number;
};

export type Person = {
  id: string;
  displayName: string;
  createdAt: number;
  updatedAt: number;
};

export type RosterMember = {
  id: string;
  name: string;
  personId: string;
  jerseyNumber: number | null;
};
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
  scoreA: number;
  scoreB: number;
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
    undoTargetEventId: string | null;
    serverTs: number;
  }>;
  scoreA: number;
  scoreB: number;
  timer: TimerState;
  eventShortCode: string | null;
};

export type TeamBrief = { id: string; name: string; colorHex: string };

export type TeamStanding = {
  teamId: string;
  teamName: string;
  colorHex: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  rank: number;
};

export type PlayerRankRow = {
  personId: string;
  rosterId: string;
  name: string;
  teamId: string;
  teamName: string;
  teamNames: string[];
  colorHex: string;
  goals?: number;
  assists?: number;
  firstGoalAt?: number;
  firstAssistAt?: number;
};

export type MvpRow = {
  personId: string;
  rosterId: string;
  name: string;
  teamName: string;
  teamNames: string[];
  colorHex: string;
  goals: number;
  assists: number;
};

export type EventReport = {
  event: {
    id: string;
    shortCode: string;
    name: string;
    createdAt: number;
    finishedAt: number | null;
  };
  games: Array<{
    id: string;
    teamA: TeamBrief;
    teamB: TeamBrief;
    scoreA: number;
    scoreB: number;
    status: string;
    durationMs: number;
  }>;
  standings: TeamStanding[];
  topScorers: Array<PlayerRankRow & { goals: number; firstGoalAt: number }>;
  topAssists: Array<PlayerRankRow & { assists: number; firstAssistAt: number }>;
  mvp?: MvpRow;
  meta: { topN: number; generatedAt: number };
};

export type GameReport = {
  game: {
    id: string;
    eventId: string;
    teamA?: TeamBrief;
    teamB?: TeamBrief;
    scoreA: number;
    scoreB: number;
    startedAt: number | null;
    finishedAt: number | null;
    durationMs: number;
    status: string;
  };
  goals: Array<{
    minute: number;
    teamSide: 'A' | 'B';
    scorerName: string;
    assistantName?: string;
    type: 'GOAL' | 'OWN_GOAL';
  }>;
  gameMvp?: MvpRow;
  meta: { generatedAt: number };
};
