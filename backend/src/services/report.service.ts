import { asc, eq } from 'drizzle-orm';
import type { AppDb } from '../db/client.js';
import { events, gameEvents, games, rosters, teams } from '../db/schema.js';
import { NotFoundError } from '../lib/errors.js';
import { nowMs } from '../lib/id.js';
import { normalizeShortCode } from '../lib/short-code.js';
import { deriveScore, getUndoneEventIds } from './game.service.js';
import { deriveElapsedMs } from './timer.service.js';

const POINTS = { win: 3, draw: 1, loss: 0 } as const;

export type ReportTeam = {
  id: string;
  name: string;
  colorHex: string;
};

export type ReportEventRow = {
  id: string;
  type: string;
  teamSide: 'A' | 'B' | null;
  scorerRosterId: string | null;
  assistantRosterId: string | null;
  undoTargetEventId: string | null;
  serverTs: number;
};

export type ReportGameInput = {
  id: string;
  teamAId: string;
  teamBId: string;
  status: string;
  startedAt: number | null;
  finishedAt: number | null;
  pausedDurationMs: number;
  pauseStartedAt: number | null;
  plannedDurationMs: number;
  events: ReportEventRow[];
};

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

export type PlayerStatRow = {
  rosterId: string;
  name: string;
  teamId: string;
  teamName: string;
  colorHex: string;
  goals: number;
  assists: number;
  firstGoalAt: number;
  firstAssistAt: number;
};

export type MvpRow = {
  rosterId: string;
  name: string;
  teamName: string;
  colorHex: string;
  goals: number;
  assists: number;
};

function emptyStanding(team: ReportTeam): Omit<TeamStanding, 'rank'> {
  return {
    teamId: team.id,
    teamName: team.name,
    colorHex: team.colorHex,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  };
}

function compareStandings(
  a: Omit<TeamStanding, 'rank'>,
  b: Omit<TeamStanding, 'rank'>,
): number {
  return (
    b.points - a.points ||
    b.goalDiff - a.goalDiff ||
    b.goalsFor - a.goalsFor ||
    a.teamName.localeCompare(b.teamName, 'zh-Hans')
  );
}

export function computeStandings(
  eventTeams: ReportTeam[],
  finishedGames: ReportGameInput[],
): TeamStanding[] {
  const acc = new Map<string, Omit<TeamStanding, 'rank'>>();
  for (const team of eventTeams) {
    acc.set(team.id, emptyStanding(team));
  }

  for (const game of finishedGames) {
    if (game.status !== 'FINISHED') continue;
    const scoreEvents = game.events.map((e) => ({
      id: e.id,
      type: e.type as 'GOAL' | 'OWN_GOAL' | 'UNDO',
      teamSide: e.teamSide,
      undoTargetEventId: e.undoTargetEventId,
    }));
    const { scoreA, scoreB } = deriveScore(scoreEvents);
    const a = acc.get(game.teamAId);
    const b = acc.get(game.teamBId);
    if (!a || !b) continue;

    a.played++;
    b.played++;
    a.goalsFor += scoreA;
    a.goalsAgainst += scoreB;
    b.goalsFor += scoreB;
    b.goalsAgainst += scoreA;

    if (scoreA > scoreB) {
      a.wins++;
      b.losses++;
    } else if (scoreA < scoreB) {
      b.wins++;
      a.losses++;
    } else {
      a.draws++;
      b.draws++;
    }
  }

  const withPoints = [...acc.values()].map((s) => ({
    ...s,
    points: s.wins * POINTS.win + s.draws * POINTS.draw,
    goalDiff: s.goalsFor - s.goalsAgainst,
  }));

  const sorted = withPoints.sort(compareStandings);
  return sorted.map((s, i) => ({ ...s, rank: i + 1 }));
}

function isActiveGoal(event: ReportEventRow, undone: Set<string>): boolean {
  return event.type === 'GOAL' && !undone.has(event.id);
}

function collectFinishedGoalEvents(finishedGames: ReportGameInput[]) {
  const rows: Array<ReportEventRow & { gameId: string }> = [];
  for (const game of finishedGames) {
    if (game.status !== 'FINISHED') continue;
    const undone = getUndoneEventIds(
      game.events.map((e) => ({
        id: e.id,
        type: e.type as 'GOAL' | 'OWN_GOAL' | 'UNDO',
        teamSide: e.teamSide,
        undoTargetEventId: e.undoTargetEventId,
      })),
    );
    for (const event of game.events) {
      if (isActiveGoal(event, undone)) {
        rows.push({ ...event, gameId: game.id });
      }
    }
  }
  return rows;
}

function buildRosterLookup(
  eventTeams: Array<ReportTeam & { roster: Array<{ id: string; name: string }> }>,
) {
  const rosterById = new Map<
    string,
    { id: string; name: string; teamId: string; teamName: string; colorHex: string }
  >();
  for (const team of eventTeams) {
    for (const player of team.roster) {
      rosterById.set(player.id, {
        id: player.id,
        name: player.name,
        teamId: team.id,
        teamName: team.name,
        colorHex: team.colorHex,
      });
    }
  }
  return rosterById;
}

function aggregatePlayerStats(
  finishedGames: ReportGameInput[],
  rosterById: ReturnType<typeof buildRosterLookup>,
): Map<string, PlayerStatRow> {
  const stats = new Map<string, PlayerStatRow>();

  for (const game of finishedGames) {
    if (game.status !== 'FINISHED') continue;
    const undone = getUndoneEventIds(
      game.events.map((e) => ({
        id: e.id,
        type: e.type as 'GOAL' | 'OWN_GOAL' | 'UNDO',
        teamSide: e.teamSide,
        undoTargetEventId: e.undoTargetEventId,
      })),
    );

    for (const event of game.events) {
      if (isActiveGoal(event, undone) && event.scorerRosterId) {
        const player = rosterById.get(event.scorerRosterId);
        if (!player) continue;
        const row =
          stats.get(player.id) ??
          ({
            rosterId: player.id,
            name: player.name,
            teamId: player.teamId,
            teamName: player.teamName,
            colorHex: player.colorHex,
            goals: 0,
            assists: 0,
            firstGoalAt: Number.MAX_SAFE_INTEGER,
            firstAssistAt: Number.MAX_SAFE_INTEGER,
          } satisfies PlayerStatRow);
        row.goals++;
        row.firstGoalAt = Math.min(row.firstGoalAt, event.serverTs);
        stats.set(player.id, row);
      }

      if (isActiveGoal(event, undone) && event.assistantRosterId) {
        const player = rosterById.get(event.assistantRosterId);
        if (!player) continue;
        const row =
          stats.get(player.id) ??
          ({
            rosterId: player.id,
            name: player.name,
            teamId: player.teamId,
            teamName: player.teamName,
            colorHex: player.colorHex,
            goals: 0,
            assists: 0,
            firstGoalAt: Number.MAX_SAFE_INTEGER,
            firstAssistAt: Number.MAX_SAFE_INTEGER,
          } satisfies PlayerStatRow);
        row.assists++;
        row.firstAssistAt = Math.min(row.firstAssistAt, event.serverTs);
        stats.set(player.id, row);
      }
    }
  }

  return stats;
}

function compareScorers(a: PlayerStatRow, b: PlayerStatRow): number {
  return (
    b.goals - a.goals ||
    a.firstGoalAt - b.firstGoalAt ||
    a.name.localeCompare(b.name, 'zh-Hans')
  );
}

function compareAssists(a: PlayerStatRow, b: PlayerStatRow): number {
  return (
    b.assists - a.assists ||
    a.firstAssistAt - b.firstAssistAt ||
    a.name.localeCompare(b.name, 'zh-Hans')
  );
}

export const REPORT_TOP_N = 5;

export function topScorers(stats: Map<string, PlayerStatRow>, topN = REPORT_TOP_N) {
  return [...stats.values()]
    .filter((s) => s.goals > 0)
    .sort(compareScorers)
    .slice(0, topN)
    .map(({ rosterId, name, teamId, teamName, colorHex, goals, firstGoalAt }) => ({
      rosterId,
      name,
      teamId,
      teamName,
      colorHex,
      goals,
      firstGoalAt: firstGoalAt === Number.MAX_SAFE_INTEGER ? 0 : firstGoalAt,
    }));
}

export function topAssists(stats: Map<string, PlayerStatRow>, topN = REPORT_TOP_N) {
  return [...stats.values()]
    .filter((s) => s.assists > 0)
    .sort(compareAssists)
    .slice(0, topN)
    .map(({ rosterId, name, teamId, teamName, colorHex, assists, firstAssistAt }) => ({
      rosterId,
      name,
      teamId,
      teamName,
      colorHex,
      assists,
      firstAssistAt: firstAssistAt === Number.MAX_SAFE_INTEGER ? 0 : firstAssistAt,
    }));
}

export function computeEventMvp(stats: Map<string, PlayerStatRow>): MvpRow | undefined {
  const candidates = [...stats.values()].filter((s) => s.goals + s.assists > 0);
  if (candidates.length === 0) return undefined;

  candidates.sort((a, b) => {
    const scoreA = a.goals + a.assists;
    const scoreB = b.goals + b.assists;
    return (
      scoreB - scoreA ||
      a.firstGoalAt - b.firstGoalAt ||
      a.name.localeCompare(b.name, 'zh-Hans')
    );
  });

  const best = candidates[0]!;
  return {
    rosterId: best.rosterId,
    name: best.name,
    teamName: best.teamName,
    colorHex: best.colorHex,
    goals: best.goals,
    assists: best.assists,
  };
}

export function computeGameMvp(
  game: ReportGameInput,
  rosterById: ReturnType<typeof buildRosterLookup>,
): MvpRow | undefined {
  const stats = aggregatePlayerStats([game], rosterById);
  return computeEventMvp(stats);
}


export async function resolveEventId(db: AppDb, idOrShortCode: string): Promise<string> {
  const [byId] = await db.select().from(events).where(eq(events.id, idOrShortCode)).limit(1);
  if (byId) return byId.id;

  const [byCode] = await db
    .select()
    .from(events)
    .where(eq(events.shortCode, normalizeShortCode(idOrShortCode)))
    .limit(1);
  if (byCode) return byCode.id;

  throw new NotFoundError('Event not found');
}

export async function getEventReport(
  db: AppDb,
  idOrShortCode: string,
  topN = REPORT_TOP_N,
) {
  const eventId = await resolveEventId(db, idOrShortCode);
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw new NotFoundError('Event not found');

  const eventTeams = await db.select().from(teams).where(eq(teams.eventId, eventId));
  const teamsWithRoster = await Promise.all(
    eventTeams.map(async (team) => ({
      id: team.id,
      name: team.name,
      colorHex: team.colorHex,
      roster: await db.select().from(rosters).where(eq(rosters.teamId, team.id)),
    })),
  );

  const eventGames = await db
    .select()
    .from(games)
    .where(eq(games.eventId, eventId))
    .orderBy(asc(games.createdAt));

  const gamesWithEvents: ReportGameInput[] = [];
  for (const game of eventGames) {
    const rows = await db
      .select()
      .from(gameEvents)
      .where(eq(gameEvents.gameId, game.id))
      .orderBy(asc(gameEvents.serverTs));
    gamesWithEvents.push({
      id: game.id,
      teamAId: game.teamAId,
      teamBId: game.teamBId,
      status: game.status,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
      pausedDurationMs: game.pausedDurationMs,
      pauseStartedAt: game.pauseStartedAt,
      plannedDurationMs: game.plannedDurationMs,
      events: rows.map((e) => ({
        id: e.id,
        type: e.type,
        teamSide: e.teamSide,
        scorerRosterId: e.scorerRosterId,
        assistantRosterId: e.assistantRosterId,
        undoTargetEventId: e.undoTargetEventId,
        serverTs: e.serverTs,
      })),
    });
  }

  const teamById = new Map(eventTeams.map((t) => [t.id, t]));
  const rosterById = buildRosterLookup(teamsWithRoster);
  const finishedGames = gamesWithEvents.filter((g) => g.status === 'FINISHED');
  const stats = aggregatePlayerStats(finishedGames, rosterById);

  const gamesBrief = gamesWithEvents.map((game) => {
    const scoreEvents = game.events.map((e) => ({
      id: e.id,
      type: e.type as 'GOAL' | 'OWN_GOAL' | 'UNDO',
      teamSide: e.teamSide,
      undoTargetEventId: e.undoTargetEventId,
    }));
    const { scoreA, scoreB } = deriveScore(scoreEvents);
    const teamA = teamById.get(game.teamAId);
    const teamB = teamById.get(game.teamBId);
    const durationMs =
      game.startedAt == null
        ? 0
        : deriveElapsedMs(
            {
              status: game.status as 'FINISHED',
              startedAt: game.startedAt,
              finishedAt: game.finishedAt,
              pausedDurationMs: game.pausedDurationMs,
              pauseStartedAt: game.pauseStartedAt,
              plannedDurationMs: game.plannedDurationMs,
            },
            game.finishedAt ?? nowMs(),
          );

    return {
      id: game.id,
      teamA: teamA
        ? { id: teamA.id, name: teamA.name, colorHex: teamA.colorHex }
        : { id: game.teamAId, name: '—', colorHex: '#64748b' },
      teamB: teamB
        ? { id: teamB.id, name: teamB.name, colorHex: teamB.colorHex }
        : { id: game.teamBId, name: '—', colorHex: '#64748b' },
      scoreA,
      scoreB,
      status: game.status,
      durationMs,
    };
  });

  return {
    event: {
      id: event.id,
      shortCode: event.shortCode,
      name: event.name,
      createdAt: event.createdAt,
      finishedAt: event.finishedAt,
    },
    games: gamesBrief,
    standings: computeStandings(eventTeams, gamesWithEvents),
    topScorers: topScorers(stats, topN),
    topAssists: topAssists(stats, topN),
    mvp: computeEventMvp(stats),
    meta: { topN, generatedAt: nowMs() },
  };
}

export async function getGameReport(db: AppDb, gameId: string) {
  const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  if (!game) throw new NotFoundError('Game not found');

  const [teamA] = await db.select().from(teams).where(eq(teams.id, game.teamAId)).limit(1);
  const [teamB] = await db.select().from(teams).where(eq(teams.id, game.teamBId)).limit(1);
  const rosterA = teamA
    ? await db.select().from(rosters).where(eq(rosters.teamId, teamA.id))
    : [];
  const rosterB = teamB
    ? await db.select().from(rosters).where(eq(rosters.teamId, teamB.id))
    : [];

  const rows = await db
    .select()
    .from(gameEvents)
    .where(eq(gameEvents.gameId, gameId))
    .orderBy(asc(gameEvents.serverTs));

  const reportEvents: ReportEventRow[] = rows.map((e) => ({
    id: e.id,
    type: e.type,
    teamSide: e.teamSide,
    scorerRosterId: e.scorerRosterId,
    assistantRosterId: e.assistantRosterId,
    undoTargetEventId: e.undoTargetEventId,
    serverTs: e.serverTs,
  }));

  const gameInput: ReportGameInput = {
    id: game.id,
    teamAId: game.teamAId,
    teamBId: game.teamBId,
    status: game.status,
    startedAt: game.startedAt,
    finishedAt: game.finishedAt,
    pausedDurationMs: game.pausedDurationMs,
    pauseStartedAt: game.pauseStartedAt,
    plannedDurationMs: game.plannedDurationMs,
    events: reportEvents,
  };

  const scoreEvents = reportEvents.map((e) => ({
    id: e.id,
    type: e.type as 'GOAL' | 'OWN_GOAL' | 'UNDO',
    teamSide: e.teamSide,
    undoTargetEventId: e.undoTargetEventId,
  }));
  const { scoreA, scoreB } = deriveScore(scoreEvents);
  const durationMs =
    game.startedAt == null
      ? 0
      : deriveElapsedMs(
          {
            status: game.status,
            startedAt: game.startedAt,
            finishedAt: game.finishedAt,
            pausedDurationMs: game.pausedDurationMs,
            pauseStartedAt: game.pauseStartedAt,
            plannedDurationMs: game.plannedDurationMs,
          },
          game.finishedAt ?? nowMs(),
        );

  const rosterById = buildRosterLookup([
    ...(teamA ? [{ id: teamA.id, name: teamA.name, colorHex: teamA.colorHex, roster: rosterA }] : []),
    ...(teamB ? [{ id: teamB.id, name: teamB.name, colorHex: teamB.colorHex, roster: rosterB }] : []),
  ]);

  const undone = getUndoneEventIds(scoreEvents);
  const nameOf = (rosterId: string | null) =>
    rosterId ? (rosterById.get(rosterId)?.name ?? '—') : undefined;

  const goals = reportEvents
    .filter(
      (e) =>
        (e.type === 'GOAL' || e.type === 'OWN_GOAL') &&
        !undone.has(e.id) &&
        e.teamSide != null,
    )
    .sort((a, b) => a.serverTs - b.serverTs)
    .map((e) => {
      const minute =
        game.startedAt == null
          ? 0
          : Math.max(0, Math.floor((e.serverTs - game.startedAt) / 60_000));
      return {
        minute,
        teamSide: e.teamSide as 'A' | 'B',
        scorerName: nameOf(e.scorerRosterId) ?? '—',
        assistantName: e.assistantRosterId ? nameOf(e.assistantRosterId) : undefined,
        type: e.type as 'GOAL' | 'OWN_GOAL',
      };
    });

  const brief = (team: typeof teamA) =>
    team ? { id: team.id, name: team.name, colorHex: team.colorHex } : undefined;

  return {
    game: {
      id: game.id,
      eventId: game.eventId,
      teamA: brief(teamA),
      teamB: brief(teamB),
      scoreA,
      scoreB,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
      durationMs,
      status: game.status,
    },
    goals,
    gameMvp: computeGameMvp(gameInput, rosterById),
    meta: { generatedAt: nowMs() },
  };
}

/** @internal exported for tests */
export const __testing = {
  collectFinishedGoalEvents,
  aggregatePlayerStats,
  buildRosterLookup,
};

export type EventReport = Awaited<ReturnType<typeof getEventReport>>;
export type GameReport = Awaited<ReturnType<typeof getGameReport>>;
