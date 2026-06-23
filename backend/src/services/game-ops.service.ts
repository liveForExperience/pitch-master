import { and, asc, eq, inArray, or } from 'drizzle-orm';
import type { AppDb } from '../db/client.js';
import { events, gameEvents, games, persons, rosters, teams } from '../db/schema.js';
import { broadcast } from '../lib/sse-broker.js';
import { newId, nowMs } from '../lib/id.js';
import { deriveScore } from './game.service.js';
import { buildTimerState } from './timer.service.js';
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors.js';
import { DEFAULT_PLANNED_DURATION_MS } from '../lib/game-defaults.js';
import { normalizeShortCode } from '../lib/short-code.js';

const DEFAULT_COLORS = [
  '#ef4444',
  '#f59e0b',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

export async function getEventByShortCode(db: AppDb, shortCode: string) {
  const normalized = normalizeShortCode(shortCode);
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.shortCode, normalized))
    .limit(1);
  if (!event) throw new NotFoundError('Event not found');

  const eventTeams = await db.select().from(teams).where(eq(teams.eventId, event.id));
  const eventGames = await db
    .select()
    .from(games)
    .where(eq(games.eventId, event.id))
    .orderBy(asc(games.createdAt));

  const rostersByTeam = await Promise.all(
    eventTeams.map(async (team) => ({
      ...team,
      roster: await db.select().from(rosters).where(eq(rosters.teamId, team.id)),
    })),
  );

  const gameIds = eventGames.map((g) => g.id);
  const allEventRows = await loadEventsForGames(db, gameIds);
  const rowsByGame = new Map<string, typeof allEventRows>();
  for (const row of allEventRows) {
    const list = rowsByGame.get(row.gameId) ?? [];
    list.push(row);
    rowsByGame.set(row.gameId, list);
  }

  return {
    id: event.id,
    shortCode: event.shortCode,
    name: event.name,
    status: event.status,
    createdAt: event.createdAt,
    finishedAt: event.finishedAt,
    teams: rostersByTeam.map(({ roster, ...team }) => ({
      id: team.id,
      name: team.name,
      colorHex: team.colorHex,
      roster: roster.map((r) => ({
        id: r.id,
        name: r.name,
        personId: r.personId,
        jerseyNumber: r.jerseyNumber,
      })),
    })),
    games: eventGames.map((g) => {
      const rows = rowsByGame.get(g.id) ?? [];
      const { scoreA, scoreB } = deriveScore(mapScoreEvents(rows));
      return {
        id: g.id,
        teamAId: g.teamAId,
        teamBId: g.teamBId,
        status: g.status,
        startedAt: g.startedAt,
        finishedAt: g.finishedAt,
        plannedDurationMs: g.plannedDurationMs,
        scoreA,
        scoreB,
      };
    }),
  };
}

export async function createTeam(
  db: AppDb,
  eventId: string,
  input: { name: string; colorHex?: string },
) {
  const eventTeams = await db.select().from(teams).where(eq(teams.eventId, eventId));
  const colorHex = input.colorHex ?? DEFAULT_COLORS[eventTeams.length % DEFAULT_COLORS.length]!;
  const id = newId();
  await db.insert(teams).values({
    id,
    eventId,
    name: input.name,
    colorHex,
    createdAt: nowMs(),
  });
  return { id, eventId, name: input.name, colorHex };
}

export type AddRosterInput = {
  names?: string[];
  personIds?: string[];
};

export async function addRosterMembers(db: AppDb, teamId: string, input: AddRosterInput) {
  const created: Array<{ id: string; teamId: string; personId: string; name: string }> = [];

  if (input.names) {
    for (const name of input.names) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const personId = newId();
      const now = nowMs();
      await db.insert(persons).values({
        id: personId,
        displayName: trimmed,
        createdAt: now,
        updatedAt: now,
      });
      const rosterId = newId();
      await db.insert(rosters).values({
        id: rosterId,
        teamId,
        personId,
        name: trimmed,
        createdAt: now,
      });
      created.push({ id: rosterId, teamId, personId, name: trimmed });
    }
  }

  if (input.personIds) {
    for (const personId of input.personIds) {
      const [person] = await db.select().from(persons).where(eq(persons.id, personId)).limit(1);
      if (!person) throw new NotFoundError(`Person ${personId} not found`);

      const [dup] = await db
        .select()
        .from(rosters)
        .where(and(eq(rosters.teamId, teamId), eq(rosters.personId, personId)))
        .limit(1);
      if (dup) throw new ConflictError('Person already on this team');

      const rosterId = newId();
      const now = nowMs();
      await db.insert(rosters).values({
        id: rosterId,
        teamId,
        personId,
        name: person.displayName,
        createdAt: now,
      });
      created.push({ id: rosterId, teamId, personId, name: person.displayName });
    }
  }

  return created;
}

export async function updateTeam(db: AppDb, teamId: string, input: { name: string }) {
  const trimmed = input.name.trim();
  if (!trimmed) throw new ValidationError('name is required');

  const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!team) throw new NotFoundError('Team not found');

  await db.update(teams).set({ name: trimmed }).where(eq(teams.id, teamId));
  return { id: teamId, eventId: team.eventId, name: trimmed, colorHex: team.colorHex };
}

export async function deleteTeam(db: AppDb, teamId: string) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!team) throw new NotFoundError('Team not found');

  // games.teamAId / teamBId have no ON DELETE CASCADE — refuse to delete a
  // team that any game already references, otherwise the foreign key would
  // be left dangling. Roster members do cascade, so removing those is safe.
  const [referenced] = await db
    .select({ id: games.id })
    .from(games)
    .where(or(eq(games.teamAId, teamId), eq(games.teamBId, teamId)))
    .limit(1);
  if (referenced) {
    throw new ConflictError('Cannot delete a team that is used in a game');
  }

  await db.delete(teams).where(eq(teams.id, teamId));
  return { id: teamId, eventId: team.eventId, name: team.name };
}

export async function removeRosterMember(db: AppDb, rosterId: string) {
  const [member] = await db.select().from(rosters).where(eq(rosters.id, rosterId)).limit(1);
  if (!member) throw new NotFoundError('Roster member not found');

  const [referenced] = await db
    .select({ id: gameEvents.id })
    .from(gameEvents)
    .where(
      or(eq(gameEvents.scorerRosterId, rosterId), eq(gameEvents.assistantRosterId, rosterId)),
    )
    .limit(1);
  if (referenced) {
    throw new ConflictError('Cannot remove player with recorded game events');
  }

  await db.delete(rosters).where(eq(rosters.id, rosterId));
  return { id: rosterId, teamId: member.teamId, name: member.name };
}

export async function createGame(
  db: AppDb,
  eventId: string,
  input: { teamAId: string; teamBId: string; plannedDurationMs?: number },
) {
  if (input.teamAId === input.teamBId) {
    throw new ValidationError('teamAId and teamBId must differ');
  }
  const id = newId();
  await db.insert(games).values({
    id,
    eventId,
    teamAId: input.teamAId,
    teamBId: input.teamBId,
    status: 'READY',
    plannedDurationMs: input.plannedDurationMs ?? DEFAULT_PLANNED_DURATION_MS,
    pausedDurationMs: 0,
    createdAt: nowMs(),
  });
  return { id, eventId, ...input, status: 'READY' as const };
}

async function loadGame(db: AppDb, gameId: string) {
  const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  if (!game) throw new NotFoundError('Game not found');
  return game;
}

async function loadGameEvents(db: AppDb, gameId: string) {
  return db
    .select()
    .from(gameEvents)
    .where(eq(gameEvents.gameId, gameId))
    .orderBy(asc(gameEvents.serverTs));
}

async function loadEventsForGames(db: AppDb, gameIds: string[]) {
  if (gameIds.length === 0) return [];
  return db
    .select()
    .from(gameEvents)
    .where(inArray(gameEvents.gameId, gameIds))
    .orderBy(asc(gameEvents.serverTs));
}

function mapScoreEvents(rows: Awaited<ReturnType<typeof loadGameEvents>>) {
  return rows.map((e) => ({
    id: e.id,
    type: e.type,
    teamSide: e.teamSide,
    undoTargetEventId: e.undoTargetEventId,
  }));
}

async function emitGameUpdate(db: AppDb, gameId: string, type: string, extra?: Record<string, unknown>) {
  const game = await loadGame(db, gameId);
  const rows = await loadGameEvents(db, gameId);
  const score = deriveScore(mapScoreEvents(rows));
  const timer = buildTimerState(game, nowMs());
  broadcast(gameId, 'game_update', { type, scoreA: score.scoreA, scoreB: score.scoreB, ...timer, ...extra });
  broadcast(gameId, 'timer_tick', { elapsedMs: timer.elapsedMs, status: timer.status });
}

export async function startGame(db: AppDb, gameId: string) {
  const game = await loadGame(db, gameId);
  if (game.status !== 'READY') throw new ConflictError('Game already started');
  const ts = nowMs();
  await db
    .update(games)
    .set({ status: 'PLAYING', startedAt: ts, pauseStartedAt: null })
    .where(eq(games.id, gameId));
  await emitGameUpdate(db, gameId, 'START');
  return { gameId, startedAt: ts };
}

export async function pauseGame(db: AppDb, gameId: string) {
  const game = await loadGame(db, gameId);
  if (game.status !== 'PLAYING') throw new ConflictError('Game is not playing');
  const ts = nowMs();
  await db
    .update(games)
    .set({ status: 'PAUSED', pauseStartedAt: ts })
    .where(eq(games.id, gameId));
  await emitGameUpdate(db, gameId, 'PAUSE');
  return { gameId, pauseStartedAt: ts };
}

export async function resumeGame(db: AppDb, gameId: string) {
  const game = await loadGame(db, gameId);
  if (game.status !== 'PAUSED' || game.pauseStartedAt == null) {
    throw new ConflictError('Game is not paused');
  }
  const ts = nowMs();
  const pausedDurationMs = game.pausedDurationMs + (ts - game.pauseStartedAt);
  await db
    .update(games)
    .set({ status: 'PLAYING', pausedDurationMs, pauseStartedAt: null })
    .where(eq(games.id, gameId));
  await emitGameUpdate(db, gameId, 'RESUME');
  return { gameId, pausedDurationMs };
}

export async function finishGame(db: AppDb, gameId: string) {
  const game = await loadGame(db, gameId);
  if (game.status === 'FINISHED') throw new ConflictError('Game already finished');
  const ts = nowMs();
  let pausedDurationMs = game.pausedDurationMs;
  if (game.status === 'PAUSED' && game.pauseStartedAt != null) {
    pausedDurationMs += ts - game.pauseStartedAt;
  }
  await db
    .update(games)
    .set({
      status: 'FINISHED',
      finishedAt: ts,
      pauseStartedAt: null,
      pausedDurationMs,
    })
    .where(eq(games.id, gameId));
  await emitGameUpdate(db, gameId, 'FINISH');
  return { gameId, finishedAt: ts };
}

export async function deleteGame(db: AppDb, gameId: string) {
  const game = await loadGame(db, gameId);
  await db.delete(games).where(eq(games.id, gameId));
  return { gameId, eventId: game.eventId };
}

export type RecordEventInput = {
  clientEventId: string;
  type: 'GOAL' | 'OWN_GOAL' | 'ASSIST';
  teamSide?: 'A' | 'B';
  scorerRosterId?: string;
  assistantRosterId?: string;
  clientTs: number;
};

export async function recordGameEvent(db: AppDb, gameId: string, input: RecordEventInput) {
  const game = await loadGame(db, gameId);
  if (game.status !== 'PLAYING' && game.status !== 'PAUSED' && game.status !== 'FINISHED') {
    throw new ConflictError('Cannot record events unless game has started');
  }

  const existing = await db
    .select()
    .from(gameEvents)
    .where(and(eq(gameEvents.gameId, gameId), eq(gameEvents.clientEventId, input.clientEventId)))
    .limit(1);
  if (existing[0]) {
    const score = deriveScore(mapScoreEvents(await loadGameEvents(db, gameId)));
    return { event: existing[0], scoreA: score.scoreA, scoreB: score.scoreB, idempotent: true };
  }

  if (input.type === 'GOAL' && (!input.teamSide || !input.scorerRosterId)) {
    throw new ValidationError('GOAL requires teamSide and scorerRosterId');
  }
  if (input.type === 'OWN_GOAL' && !input.teamSide) {
    throw new ValidationError('OWN_GOAL requires teamSide');
  }

  const id = newId();
  const serverTs = nowMs();
  const row = {
    id,
    gameId,
    clientEventId: input.clientEventId,
    type: input.type,
    teamSide: input.teamSide ?? null,
    scorerRosterId: input.scorerRosterId ?? null,
    assistantRosterId: input.assistantRosterId ?? null,
    undoTargetEventId: null,
    clientTs: input.clientTs,
    serverTs,
  };
  await db.insert(gameEvents).values(row);

  const score = deriveScore(mapScoreEvents(await loadGameEvents(db, gameId)));
  await emitGameUpdate(db, gameId, input.type, { gameEvent: row });
  return { event: row, scoreA: score.scoreA, scoreB: score.scoreB, idempotent: false };
}

export async function undoGameEvent(
  db: AppDb,
  gameId: string,
  targetEventId: string,
  opts?: { clientEventId?: string; clientTs?: number },
) {
  const game = await loadGame(db, gameId);
  if (game.status === 'READY') throw new ConflictError('Cannot undo events before game starts');

  const clientEventId = opts?.clientEventId ?? `undo-${targetEventId}-${nowMs()}`;

  const existingByClient = await db
    .select()
    .from(gameEvents)
    .where(and(eq(gameEvents.gameId, gameId), eq(gameEvents.clientEventId, clientEventId)))
    .limit(1);
  if (existingByClient[0]) {
    const score = deriveScore(mapScoreEvents(await loadGameEvents(db, gameId)));
    return {
      event: existingByClient[0],
      scoreA: score.scoreA,
      scoreB: score.scoreB,
      idempotent: true as const,
    };
  }

  const [target] = await db
    .select()
    .from(gameEvents)
    .where(and(eq(gameEvents.id, targetEventId), eq(gameEvents.gameId, gameId)))
    .limit(1);
  if (!target) throw new NotFoundError('Event not found');
  if (target.type === 'UNDO') throw new ValidationError('Cannot undo an UNDO event');

  const existingUndo = await db
    .select()
    .from(gameEvents)
    .where(and(eq(gameEvents.gameId, gameId), eq(gameEvents.undoTargetEventId, targetEventId)))
    .limit(1);
  if (existingUndo[0]) {
    const score = deriveScore(mapScoreEvents(await loadGameEvents(db, gameId)));
    return { event: existingUndo[0], scoreA: score.scoreA, scoreB: score.scoreB, idempotent: true as const };
  }

  const id = newId();
  const serverTs = nowMs();
  const row = {
    id,
    gameId,
    clientEventId,
    type: 'UNDO' as const,
    teamSide: null,
    scorerRosterId: null,
    assistantRosterId: null,
    undoTargetEventId: targetEventId,
    clientTs: opts?.clientTs ?? serverTs,
    serverTs,
  };
  await db.insert(gameEvents).values(row);

  const score = deriveScore(mapScoreEvents(await loadGameEvents(db, gameId)));
  await emitGameUpdate(db, gameId, 'UNDO', { gameEvent: row });
  return { event: row, scoreA: score.scoreA, scoreB: score.scoreB, idempotent: false as const };
}

export async function getGameDetail(db: AppDb, gameId: string) {
  const game = await loadGame(db, gameId);
  const rows = await loadGameEvents(db, gameId);
  const score = deriveScore(mapScoreEvents(rows));
  const timer = buildTimerState(game, nowMs());
  const [teamA] = await db.select().from(teams).where(eq(teams.id, game.teamAId)).limit(1);
  const [teamB] = await db.select().from(teams).where(eq(teams.id, game.teamBId)).limit(1);
  const [eventRow] = await db.select().from(events).where(eq(events.id, game.eventId)).limit(1);
  const rosterA = teamA
    ? await db.select().from(rosters).where(eq(rosters.teamId, teamA.id))
    : [];
  const rosterB = teamB
    ? await db.select().from(rosters).where(eq(rosters.teamId, teamB.id))
    : [];

  const mapTeam = (
    team: typeof teamA | undefined,
    roster: typeof rosterA,
  ) =>
    team
      ? {
          id: team.id,
          name: team.name,
          colorHex: team.colorHex,
        roster: roster.map((r) => ({
          id: r.id,
          name: r.name,
          personId: r.personId,
          jerseyNumber: r.jerseyNumber,
        })),
        }
      : undefined;

  return {
    game: {
      id: game.id,
      eventId: game.eventId,
      teamAId: game.teamAId,
      teamBId: game.teamBId,
      status: game.status,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
      plannedDurationMs: game.plannedDurationMs,
      pausedDurationMs: game.pausedDurationMs,
      pauseStartedAt: game.pauseStartedAt,
    },
    teamA: mapTeam(teamA, rosterA),
    teamB: mapTeam(teamB, rosterB),
    events: rows,
    scoreA: score.scoreA,
    scoreB: score.scoreB,
    timer,
    eventShortCode: eventRow?.shortCode ?? null,
  };
}

export async function getGameState(db: AppDb, gameId: string) {
  const game = await loadGame(db, gameId);
  const rows = await loadGameEvents(db, gameId);
  const score = deriveScore(mapScoreEvents(rows));
  const timer = buildTimerState(game, nowMs());
  return { scoreA: score.scoreA, scoreB: score.scoreB, timer, status: game.status };
}
