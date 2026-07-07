import { asc, eq } from 'drizzle-orm';
import type { AppDb } from '../db/client.js';
import { events, gameEvents, games, rosters, teams } from '../db/schema.js';
import { NotFoundError } from '../lib/errors.js';
import { nowMs } from '../lib/id.js';
import { normalizeShortCode } from '../lib/short-code.js';
import { deriveScore, getUndoneEventIds } from './game.service.js';
import { deriveShootoutState } from './shootout.service.js';
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
  personId: string;
  rosterId: string;
  name: string;
  teamId: string;
  teamName: string;
  teamNames: string[];
  colorHex: string;
  goals: number;
  assists: number;
  firstGoalAt: number;
  firstAssistAt: number;
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

type StandingCore = Omit<TeamStanding, 'rank'>;

type MatchOutcome = 'A_WIN' | 'B_WIN' | 'DRAW';

/**
 * The single source of truth for "who won this finished game".
 *
 *   - Regulation not level  → follows the regulation score
 *   - Regulation level      → shootout winner if the shootout has a
 *                             current leader (equal rounds, made counts
 *                             differ); otherwise DRAW
 *
 * `shootoutState.winner` is broadly defined as the current shootout
 * leader (see shootout.service.ts::decideWinner) — it is set whenever
 * both sides have taken the same number of kicks and one side is
 * ahead. Requiring `SHOOTOUT_END` here would silently keep 0-0 games
 * marked as draws whenever the admin forgot to press the button, which
 * is the exact bug we want to avoid.
 *
 * Regulation goals are still counted for goalsFor/goalsAgainst — the
 * shootout only decides win/loss/draw.
 */
export function resolveMatchOutcome(
  scoreA: number,
  scoreB: number,
  shootoutState: { winner: 'A' | 'B' | null } | null,
): MatchOutcome {
  if (scoreA > scoreB) return 'A_WIN';
  if (scoreA < scoreB) return 'B_WIN';
  if (shootoutState?.winner === 'A') return 'A_WIN';
  if (shootoutState?.winner === 'B') return 'B_WIN';
  return 'DRAW';
}

/**
 * Compute a per-team mini-league restricted to games between the given
 * subset of team ids. Used for head-to-head tie-breaking: if two or more
 * teams are level on points+GD+GF, sort them by their results against
 * each other (mini-league on points → GD → GF).
 */
function miniLeague(
  teamIds: Set<string>,
  eventTeams: ReportTeam[],
  finishedGames: ReportGameInput[],
): Map<string, StandingCore> {
  const acc = new Map<string, StandingCore>();
  for (const team of eventTeams) {
    if (teamIds.has(team.id)) acc.set(team.id, emptyStanding(team));
  }

  for (const game of finishedGames) {
    if (game.status !== 'FINISHED') continue;
    if (!teamIds.has(game.teamAId) || !teamIds.has(game.teamBId)) continue;

    const scoreEvents = game.events.map((e) => ({
      id: e.id,
      type: e.type as import('../types/domain.js').GameEventType,
      teamSide: e.teamSide,
      undoTargetEventId: e.undoTargetEventId,
    }));
    const { scoreA, scoreB } = deriveScore(scoreEvents);
    const shootoutState = deriveShootoutState(scoreEvents);
    const outcome = resolveMatchOutcome(scoreA, scoreB, shootoutState);
    const a = acc.get(game.teamAId);
    const b = acc.get(game.teamBId);
    if (!a || !b) continue;

    a.played++;
    b.played++;
    a.goalsFor += scoreA;
    a.goalsAgainst += scoreB;
    b.goalsFor += scoreB;
    b.goalsAgainst += scoreA;

    if (outcome === 'A_WIN') {
      a.wins++;
      b.losses++;
    } else if (outcome === 'B_WIN') {
      b.wins++;
      a.losses++;
    } else {
      a.draws++;
      b.draws++;
    }
  }

  for (const s of acc.values()) {
    s.points = s.wins * POINTS.win + s.draws * POINTS.draw;
    s.goalDiff = s.goalsFor - s.goalsAgainst;
  }
  return acc;
}

/**
 * Break a tie between two-or-more teams that are level on
 * points/GD/GF using their head-to-head mini-league. If they are still
 * level (or only played 0 games among themselves), they remain tied.
 */
function headToHeadRank(
  tied: StandingCore[],
  eventTeams: ReportTeam[],
  finishedGames: ReportGameInput[],
): StandingCore[][] {
  if (tied.length <= 1) return [tied];
  const subset = new Set(tied.map((t) => t.teamId));
  const mini = miniLeague(subset, eventTeams, finishedGames);

  const buckets = new Map<string, StandingCore[]>();
  for (const s of tied) {
    const m = mini.get(s.teamId)!;
    const key = `${m.points}|${m.goalDiff}|${m.goalsFor}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(s);
    buckets.set(key, bucket);
  }

  const sortedKeys = [...buckets.keys()].sort((ka, kb) => {
    const [pa, da, fa] = ka.split('|').map(Number);
    const [pb, db, fb] = kb.split('|').map(Number);
    return (pb ?? 0) - (pa ?? 0) || (db ?? 0) - (da ?? 0) || (fb ?? 0) - (fa ?? 0);
  });

  return sortedKeys.map((k) => buckets.get(k)!);
}

export function computeStandings(
  eventTeams: ReportTeam[],
  finishedGames: ReportGameInput[],
): TeamStanding[] {
  const acc = new Map<string, StandingCore>();
  for (const team of eventTeams) {
    acc.set(team.id, emptyStanding(team));
  }

  for (const game of finishedGames) {
    if (game.status !== 'FINISHED') continue;
    const scoreEvents = game.events.map((e) => ({
      id: e.id,
      type: e.type as import('../types/domain.js').GameEventType,
      teamSide: e.teamSide,
      undoTargetEventId: e.undoTargetEventId,
    }));
    const { scoreA, scoreB } = deriveScore(scoreEvents);
    const shootoutState = deriveShootoutState(scoreEvents);
    const outcome = resolveMatchOutcome(scoreA, scoreB, shootoutState);
    const a = acc.get(game.teamAId);
    const b = acc.get(game.teamBId);
    if (!a || !b) continue;

    a.played++;
    b.played++;
    a.goalsFor += scoreA;
    a.goalsAgainst += scoreB;
    b.goalsFor += scoreB;
    b.goalsAgainst += scoreA;

    if (outcome === 'A_WIN') {
      a.wins++;
      b.losses++;
    } else if (outcome === 'B_WIN') {
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

  // Group by primary triple (points / GD / GF), sort groups by triple,
  // and for each ambiguous group apply head-to-head mini-league.
  const primaryBuckets = new Map<string, StandingCore[]>();
  for (const s of withPoints) {
    const key = `${s.points}|${s.goalDiff}|${s.goalsFor}`;
    const list = primaryBuckets.get(key) ?? [];
    list.push(s);
    primaryBuckets.set(key, list);
  }
  const orderedKeys = [...primaryBuckets.keys()].sort((ka, kb) => {
    const [pa, da, fa] = ka.split('|').map(Number);
    const [pb, db, fb] = kb.split('|').map(Number);
    return (pb ?? 0) - (pa ?? 0) || (db ?? 0) - (da ?? 0) || (fb ?? 0) - (fa ?? 0);
  });

  // Emit `tiedRank` groups: teams sharing the same rank end up on the
  // same slot number (classic 1224 dense-like ranking used by leagues).
  const ranked: TeamStanding[] = [];
  let nextRank = 1;
  for (const key of orderedKeys) {
    const group = primaryBuckets.get(key)!;
    const subgroups = headToHeadRank(group, eventTeams, finishedGames);
    for (const sub of subgroups) {
      // Everyone in this subgroup shares the same rank slot.
      const rank = nextRank;
      // Within a still-tied subgroup, keep a deterministic display order
      // by team name (does not change the rank number they share).
      const stable = [...sub].sort((a, b) =>
        a.teamName.localeCompare(b.teamName, 'zh-Hans'),
      );
      for (const s of stable) ranked.push({ ...s, rank });
      nextRank += sub.length;
    }
  }
  return ranked;
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

type RosterLookupEntry = {
  id: string;
  name: string;
  personId: string;
  teamId: string;
  teamName: string;
  colorHex: string;
};

function buildRosterLookup(
  eventTeams: Array<ReportTeam & { roster: Array<{ id: string; name: string; personId: string }> }>,
) {
  const rosterById = new Map<string, RosterLookupEntry>();
  for (const team of eventTeams) {
    for (const player of team.roster) {
      rosterById.set(player.id, {
        id: player.id,
        name: player.name,
        personId: player.personId,
        teamId: team.id,
        teamName: team.name,
        colorHex: team.colorHex,
      });
    }
  }
  return rosterById;
}

function ensureStatRow(stats: Map<string, PlayerStatRow>, roster: RosterLookupEntry): PlayerStatRow {
  const existing = stats.get(roster.personId);
  if (existing) {
    if (!existing.teamNames.includes(roster.teamName)) {
      existing.teamNames.push(roster.teamName);
    }
    return existing;
  }
  const row: PlayerStatRow = {
    personId: roster.personId,
    rosterId: roster.id,
    name: roster.name,
    teamId: roster.teamId,
    teamName: roster.teamName,
    teamNames: [roster.teamName],
    colorHex: roster.colorHex,
    goals: 0,
    assists: 0,
    firstGoalAt: Number.MAX_SAFE_INTEGER,
    firstAssistAt: Number.MAX_SAFE_INTEGER,
  };
  stats.set(roster.personId, row);
  return row;
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
        const roster = rosterById.get(event.scorerRosterId);
        if (!roster) continue;
        const row = ensureStatRow(stats, roster);
        row.goals++;
        row.firstGoalAt = Math.min(row.firstGoalAt, event.serverTs);
      }

      if (isActiveGoal(event, undone) && event.assistantRosterId) {
        const roster = rosterById.get(event.assistantRosterId);
        if (!roster) continue;
        const row = ensureStatRow(stats, roster);
        row.assists++;
        row.firstAssistAt = Math.min(row.firstAssistAt, event.serverTs);
      }
    }
  }

  return stats;
}

function compareScorers(a: PlayerStatRow, b: PlayerStatRow): number {
  // Tie-break rule: when goals are equal, use player name (alphabetical /
  // pinyin) rather than "who scored first". Product decision — same for
  // assists below.
  return b.goals - a.goals || a.name.localeCompare(b.name, 'zh-Hans');
}

function compareAssists(a: PlayerStatRow, b: PlayerStatRow): number {
  return b.assists - a.assists || a.name.localeCompare(b.name, 'zh-Hans');
}

export const REPORT_TOP_N = 5;

export function topScorers(stats: Map<string, PlayerStatRow>, topN = REPORT_TOP_N) {
  return [...stats.values()]
    .filter((s) => s.goals > 0)
    .sort(compareScorers)
    .slice(0, topN)
    .map(
      ({ personId, rosterId, name, teamId, teamName, teamNames, colorHex, goals, firstGoalAt }) => ({
        personId,
        rosterId,
        name,
        teamId,
        teamName,
        teamNames,
        colorHex,
        goals,
        firstGoalAt: firstGoalAt === Number.MAX_SAFE_INTEGER ? 0 : firstGoalAt,
      }),
    );
}

export function topAssists(stats: Map<string, PlayerStatRow>, topN = REPORT_TOP_N) {
  return [...stats.values()]
    .filter((s) => s.assists > 0)
    .sort(compareAssists)
    .slice(0, topN)
    .map(
      ({ personId, rosterId, name, teamId, teamName, teamNames, colorHex, assists, firstAssistAt }) => ({
        personId,
        rosterId,
        name,
        teamId,
        teamName,
        teamNames,
        colorHex,
        assists,
        firstAssistAt: firstAssistAt === Number.MAX_SAFE_INTEGER ? 0 : firstAssistAt,
      }),
    );
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
    personId: best.personId,
    rosterId: best.rosterId,
    name: best.name,
    teamName: best.teamName,
    teamNames: best.teamNames,
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

    const shootoutState = deriveShootoutState(
      game.events.map((e) => ({
        id: e.id,
        type: e.type as import('../types/domain.js').GameEventType,
        teamSide: e.teamSide,
        undoTargetEventId: e.undoTargetEventId,
      })),
    );
    const shootout =
      shootoutState.attemptsA + shootoutState.attemptsB > 0
        ? {
            madeA: shootoutState.madeA,
            madeB: shootoutState.madeB,
            winner: shootoutState.winner,
            ended: shootoutState.ended,
          }
        : null;

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
      shootout,
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
  const shootoutState = deriveShootoutState(
    reportEvents.map((e) => ({
      id: e.id,
      type: e.type as
        | 'GOAL'
        | 'OWN_GOAL'
        | 'UNDO'
        | 'PENALTY_MADE'
        | 'PENALTY_MISSED'
        | 'SHOOTOUT_END',
      teamSide: e.teamSide,
      undoTargetEventId: e.undoTargetEventId,
    })),
  );
  const shootout =
    shootoutState.attemptsA + shootoutState.attemptsB > 0
      ? {
          madeA: shootoutState.madeA,
          madeB: shootoutState.madeB,
          attemptsA: shootoutState.attemptsA,
          attemptsB: shootoutState.attemptsB,
          winner: shootoutState.winner,
          decided: shootoutState.decided,
          ended: shootoutState.ended,
        }
      : null;
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
    shootout,
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
