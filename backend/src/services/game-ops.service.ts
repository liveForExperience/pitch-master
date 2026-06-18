import { and, asc, eq } from 'drizzle-orm';
import type { AppDb } from '../db/client.js';
import { events, gameEvents, games, rosters, teams } from '../db/schema.js';
import { broadcast } from '../lib/sse-broker.js';
import { newId, nowMs } from '../lib/id.js';
import { deriveScore } from './game.service.js';
import { buildTimerState } from './timer.service.js';

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

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export async function getEventByShortCode(db: AppDb, shortCode: string) {
  const [event] = await db.select().from(events).where(eq(events.shortCode, shortCode)).limit(1);
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
        jerseyNumber: r.jerseyNumber,
      })),
    })),
    games: eventGames.map((g) => ({
      id: g.id,
      teamAId: g.teamAId,
      teamBId: g.teamBId,
      status: g.status,
      startedAt: g.startedAt,
      finishedAt: g.finishedAt,
      plannedDurationMs: g.plannedDurationMs,
    })),
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

export async function addRosterMembers(db: AppDb, teamId: string, names: string[]) {
  const created = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const id = newId();
    await db.insert(rosters).values({
      id,
      teamId,
      name: trimmed,
      createdAt: nowMs(),
    });
    created.push({ id, teamId, name: trimmed });
  }
  return created;
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
    plannedDurationMs: input.plannedDurationMs ?? 30 * 60 * 1000,
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
  if (game.status !== 'PLAYING' && game.status !== 'PAUSED') {
    throw new ConflictError('Cannot record events unless game is in progress');
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

export async function undoGameEvent(db: AppDb, gameId: string, targetEventId: string) {
  const game = await loadGame(db, gameId);
  if (game.status === 'FINISHED') throw new ConflictError('Game is finished');

  const [target] = await db
    .select()
    .from(gameEvents)
    .where(and(eq(gameEvents.id, targetEventId), eq(gameEvents.gameId, gameId)))
    .limit(1);
  if (!target) throw new NotFoundError('Event not found');
  if (target.type === 'UNDO') throw new ValidationError('Cannot undo an UNDO event');

  const clientEventId = `undo-${targetEventId}-${nowMs()}`;
  const existingUndo = await db
    .select()
    .from(gameEvents)
    .where(and(eq(gameEvents.gameId, gameId), eq(gameEvents.undoTargetEventId, targetEventId)))
    .limit(1);
  if (existingUndo[0]) {
    const score = deriveScore(mapScoreEvents(await loadGameEvents(db, gameId)));
    return { event: existingUndo[0], scoreA: score.scoreA, scoreB: score.scoreB };
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
    clientTs: serverTs,
    serverTs,
  };
  await db.insert(gameEvents).values(row);

  const score = deriveScore(mapScoreEvents(await loadGameEvents(db, gameId)));
  await emitGameUpdate(db, gameId, 'UNDO', { gameEvent: row });
  return { event: row, scoreA: score.scoreA, scoreB: score.scoreB };
}

export async function getGameDetail(db: AppDb, gameId: string) {
  const game = await loadGame(db, gameId);
  const rows = await loadGameEvents(db, gameId);
  const score = deriveScore(mapScoreEvents(rows));
  const timer = buildTimerState(game, nowMs());
  const [teamA] = await db.select().from(teams).where(eq(teams.id, game.teamAId)).limit(1);
  const [teamB] = await db.select().from(teams).where(eq(teams.id, game.teamBId)).limit(1);
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
  };
}

export async function getGameState(db: AppDb, gameId: string) {
  const game = await loadGame(db, gameId);
  const rows = await loadGameEvents(db, gameId);
  const score = deriveScore(mapScoreEvents(rows));
  const timer = buildTimerState(game, nowMs());
  return { scoreA: score.scoreA, scoreB: score.scoreB, timer, status: game.status };
}
