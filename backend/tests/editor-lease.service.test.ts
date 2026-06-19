import { describe, expect, it } from 'vitest';
import {
  claimEditorLease,
  isEditorLeaseActive,
  releaseEditorLease,
} from '../src/services/editor-lease.service.js';
import { EditorLeaseError } from '../src/lib/errors.js';
import { createEvent } from '../src/services/event.service.js';
import {
  createGame,
  createTeam,
} from '../src/services/game-ops.service.js';
import { EDITOR_LEASE_TTL_MS } from '../src/lib/editor-lease-config.js';
import { setupTestDb } from './helpers/test-db.js';

describe('editor-lease.service', () => {
  async function seedGame() {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '租约测试');
    const teamA = await createTeam(db, evt.id, { name: '红' });
    const teamB = await createTeam(db, evt.id, { name: '蓝' });
    const game = await createGame(db, evt.id, { teamAId: teamA.id, teamBId: teamB.id });
    return { db, game };
  }

  it('claims and renews lease for same device', async () => {
    const { db, game } = await seedGame();
    const first = await claimEditorLease(db, game.id, 'device-a');
    const second = await claimEditorLease(db, game.id, 'device-a');
    expect(second.deviceId).toBe('device-a');
    expect(second.expiresAt).toBeGreaterThanOrEqual(first.expiresAt);
  });

  it('rejects claim when held by another device', async () => {
    const { db, game } = await seedGame();
    await claimEditorLease(db, game.id, 'device-a');
    await expect(claimEditorLease(db, game.id, 'device-b')).rejects.toBeInstanceOf(
      EditorLeaseError,
    );
  });

  it('allows force claim from another device', async () => {
    const { db, game } = await seedGame();
    await claimEditorLease(db, game.id, 'device-a');
    const stolen = await claimEditorLease(db, game.id, 'device-b', true);
    expect(stolen.deviceId).toBe('device-b');
  });

  it('release clears lease for holder only', async () => {
    const { db, game } = await seedGame();
    await claimEditorLease(db, game.id, 'device-a');
    const released = await releaseEditorLease(db, game.id, 'device-a');
    expect(released.released).toBe(true);
    await expect(claimEditorLease(db, game.id, 'device-b')).resolves.toBeDefined();
  });

  it('treats expired lease as inactive', () => {
    const at = Date.now();
    const gameRow = {
      editorDeviceId: 'device-a',
      editorLeaseExpiresAt: at - 1,
    } as Parameters<typeof isEditorLeaseActive>[0];
    expect(isEditorLeaseActive(gameRow, at)).toBe(false);
    expect(EDITOR_LEASE_TTL_MS).toBe(90_000);
  });
});
