import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const events = sqliteTable(
  'event',
  {
    id: text('id').primaryKey(),
    shortCode: text('short_code').notNull(),
    name: text('name').notNull(),
    adminTokenHash: text('admin_token_hash').notNull(),
    adminPin: text('admin_pin').notNull(),
    status: text('status', { enum: ['DRAFT', 'ONGOING', 'FINISHED'] })
      .notNull()
      .default('DRAFT'),
    createdAt: integer('created_at').notNull(),
    finishedAt: integer('finished_at'),
  },
  (t) => [uniqueIndex('idx_event_short_code').on(t.shortCode)],
);

export const teams = sqliteTable(
  'team',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    colorHex: text('color_hex').notNull().default('#22c55e'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('idx_team_event').on(t.eventId)],
);

export const rosters = sqliteTable(
  'roster',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    jerseyNumber: integer('jersey_number'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('idx_roster_team').on(t.teamId)],
);

export const games = sqliteTable(
  'game',
  {
    id: text('id').primaryKey(),
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    teamAId: text('team_a_id')
      .notNull()
      .references(() => teams.id),
    teamBId: text('team_b_id')
      .notNull()
      .references(() => teams.id),
    status: text('status', { enum: ['READY', 'PLAYING', 'PAUSED', 'FINISHED'] })
      .notNull()
      .default('READY'),
    startedAt: integer('started_at'),
    finishedAt: integer('finished_at'),
    plannedDurationMs: integer('planned_duration_ms').notNull().default(30 * 60 * 1000),
    pausedDurationMs: integer('paused_duration_ms').notNull().default(0),
    pauseStartedAt: integer('pause_started_at'),
    createdAt: integer('created_at').notNull(),
  },
  (t) => [index('idx_game_event').on(t.eventId)],
);

export const gameEvents = sqliteTable(
  'game_event',
  {
    id: text('id').primaryKey(),
    gameId: text('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    clientEventId: text('client_event_id').notNull(),
    type: text('type', {
      enum: ['GOAL', 'OWN_GOAL', 'ASSIST', 'UNDO', 'PAUSE', 'RESUME', 'START', 'FINISH'],
    }).notNull(),
    teamSide: text('team_side', { enum: ['A', 'B'] }),
    scorerRosterId: text('scorer_roster_id'),
    assistantRosterId: text('assistant_roster_id'),
    undoTargetEventId: text('undo_target_event_id'),
    clientTs: integer('client_ts').notNull(),
    serverTs: integer('server_ts').notNull(),
  },
  (t) => [
    index('idx_game_event_game').on(t.gameId, t.serverTs),
    uniqueIndex('idx_game_event_idem').on(t.gameId, t.clientEventId),
  ],
);

export type EventRow = typeof events.$inferSelect;
export type TeamRow = typeof teams.$inferSelect;
export type RosterRow = typeof rosters.$inferSelect;
export type GameRow = typeof games.$inferSelect;
export type GameEventRow = typeof gameEvents.$inferSelect;
