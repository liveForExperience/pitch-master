import type { Context } from 'hono';
import { eq } from 'drizzle-orm';
import type { AppDb } from '../db/client.js';
import { games, teams } from '../db/schema.js';
import { resolveEventAdmin } from '../services/event.service.js';
import { AuthError } from '../lib/errors.js';
import { fail } from './api-response.js';

export function parseAdminCredentials(c: Context): { bearerToken?: string; pin?: string } {
  const header = c.req.header('Authorization');
  const bearerToken = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;
  const pin = c.req.query('pin') ?? undefined;
  return { bearerToken, pin };
}

export async function requireEventAdmin(
  c: Context,
  db: AppDb,
  eventId: string,
): Promise<{ eventId: string; newAdminToken?: string } | Response> {
  try {
    return await resolveEventAdmin(db, eventId, parseAdminCredentials(c));
  } catch (err) {
    if (err instanceof AuthError) return fail(c, 'unauthorized', err.message, 401);
    throw err;
  }
}

export async function requireTeamAdmin(c: Context, db: AppDb, teamId: string) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!team) return fail(c, 'not_found', 'Team not found', 404);
  return requireEventAdmin(c, db, team.eventId);
}

export async function requireGameAdmin(c: Context, db: AppDb, gameId: string) {
  const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  if (!game) return fail(c, 'not_found', 'Game not found', 404);
  return requireEventAdmin(c, db, game.eventId);
}
