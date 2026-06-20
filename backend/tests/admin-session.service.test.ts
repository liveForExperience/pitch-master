import { describe, expect, it } from 'vitest';
import { getAdminSession } from '../src/services/admin-session.service.js';
import { createEvent, resolveEventAdmin } from '../src/services/event.service.js';
import { setupTestDb } from './helpers/test-db.js';

describe('admin-session.service', () => {
  it('viewer when no token', async () => {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '测试');
    const session = await getAdminSession(db, evt.shortCode, {});
    expect(session.role).toBe('viewer');
    expect(session.tokenStatus).toBe('none');
  });

  it('admin when token matches server hash', async () => {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '测试');
    const session = await getAdminSession(db, evt.shortCode, {
      bearerToken: evt.adminToken,
    });
    expect(session.role).toBe('admin');
    expect(session.tokenStatus).toBe('valid');
  });

  it('invalid token reported as viewer', async () => {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '测试');
    const session = await getAdminSession(db, evt.shortCode, {
      bearerToken: 'tok_bad',
    });
    expect(session.role).toBe('viewer');
    expect(session.tokenStatus).toBe('invalid');
  });

  it('old token invalid after PIN restore rotates hash', async () => {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '测试');
    const oldToken = evt.adminToken;

    const restored = await resolveEventAdmin(db, evt.id, { pin: evt.pin });
    expect(restored.newAdminToken).toBeDefined();
    expect(restored.newAdminToken).not.toBe(oldToken);

    const oldSession = await getAdminSession(db, evt.shortCode, { bearerToken: oldToken });
    expect(oldSession.tokenStatus).toBe('invalid');
    expect(oldSession.role).toBe('viewer');

    const newSession = await getAdminSession(db, evt.shortCode, {
      bearerToken: restored.newAdminToken,
    });
    expect(newSession.tokenStatus).toBe('valid');
    expect(newSession.role).toBe('admin');
  });
});
