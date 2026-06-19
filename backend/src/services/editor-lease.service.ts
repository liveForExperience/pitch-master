import { eq } from 'drizzle-orm';
import type { AppDb } from '../db/client.js';
import { games } from '../db/schema.js';
import type { GameRow } from '../db/schema.js';
import { EDITOR_LEASE_TTL_MS } from '../lib/editor-lease-config.js';
import { EditorLeaseError, NotFoundError } from '../lib/errors.js';
import { nowMs } from '../lib/id.js';
import { broadcast } from '../lib/sse-broker.js';

export type EditorState = {
  deviceId: string | null;
  expiresAt: number | null;
  isHeldByMe: boolean;
};

export function isEditorLeaseActive(game: GameRow, atMs = nowMs()): boolean {
  return (
    game.editorDeviceId != null &&
    game.editorLeaseExpiresAt != null &&
    atMs <= game.editorLeaseExpiresAt
  );
}

export function buildEditorState(
  game: GameRow,
  requestDeviceId?: string | null,
): EditorState {
  const active = isEditorLeaseActive(game);
  const deviceId = active ? game.editorDeviceId : null;
  const expiresAt = active ? game.editorLeaseExpiresAt : null;
  return {
    deviceId,
    expiresAt,
    isHeldByMe: Boolean(requestDeviceId && deviceId === requestDeviceId),
  };
}

function emitEditorChanged(gameId: string, deviceId: string | null, expiresAt: number | null) {
  broadcast(gameId, 'editor_changed', { deviceId, expiresAt });
}

async function loadGameRow(db: AppDb, gameId: string): Promise<GameRow> {
  const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
  if (!game) throw new NotFoundError('Game not found');
  return game;
}

export async function claimEditorLease(
  db: AppDb,
  gameId: string,
  deviceId: string,
  force = false,
): Promise<{ deviceId: string; expiresAt: number }> {
  if (!deviceId.trim()) {
    throw new EditorLeaseError('deviceId is required', {
      holderDeviceId: null,
      expiresAt: null,
    });
  }

  const game = await loadGameRow(db, gameId);
  const at = nowMs();
  const active = isEditorLeaseActive(game, at);

  if (active && game.editorDeviceId !== deviceId && !force) {
    throw new EditorLeaseError('Editor lease held by another device', {
      holderDeviceId: game.editorDeviceId,
      expiresAt: game.editorLeaseExpiresAt,
    });
  }

  const expiresAt = at + EDITOR_LEASE_TTL_MS;
  await db
    .update(games)
    .set({ editorDeviceId: deviceId, editorLeaseExpiresAt: expiresAt })
    .where(eq(games.id, gameId));

  emitEditorChanged(gameId, deviceId, expiresAt);
  return { deviceId, expiresAt };
}

export async function releaseEditorLease(
  db: AppDb,
  gameId: string,
  deviceId: string,
): Promise<{ released: boolean }> {
  const game = await loadGameRow(db, gameId);
  if (!isEditorLeaseActive(game) || game.editorDeviceId !== deviceId) {
    return { released: false };
  }

  await db
    .update(games)
    .set({ editorDeviceId: null, editorLeaseExpiresAt: null })
    .where(eq(games.id, gameId));

  emitEditorChanged(gameId, null, null);
  return { released: true };
}

export async function assertEditorLease(
  db: AppDb,
  gameId: string,
  deviceId: string,
): Promise<void> {
  const game = await loadGameRow(db, gameId);
  if (!deviceId.trim()) {
    throw new EditorLeaseError('X-Device-Id header required', {
      holderDeviceId: game.editorDeviceId,
      expiresAt: game.editorLeaseExpiresAt,
    });
  }

  if (!isEditorLeaseActive(game) || game.editorDeviceId !== deviceId) {
    throw new EditorLeaseError('Editor lease required', {
      holderDeviceId: isEditorLeaseActive(game) ? game.editorDeviceId : null,
      expiresAt: isEditorLeaseActive(game) ? game.editorLeaseExpiresAt : null,
    });
  }
}
