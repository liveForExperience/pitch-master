import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { rosters } from '../src/db/schema.js';
import { createPerson, listPersons, renamePerson } from '../src/services/person.service.js';
import { setupTestDb } from './helpers/test-db.js';

describe('person.service', () => {
  it('creates a person with trimmed displayName', async () => {
    const { db } = setupTestDb();
    const person = await createPerson(db, '  张三  ');
    expect(person.displayName).toBe('张三');
    expect(person.id).toBeTruthy();
  });

  it('rejects empty displayName on create', async () => {
    const { db } = setupTestDb();
    await expect(createPerson(db, '   ')).rejects.toThrow('displayName is required');
  });

  it('lists persons ordered by updatedAt desc', async () => {
    const { db } = setupTestDb();
    await createPerson(db, '甲');
    await createPerson(db, '乙');
    const list = await listPersons(db);
    expect(list.length).toBe(2);
    expect(list[0]!.updatedAt).toBeGreaterThanOrEqual(list[1]!.updatedAt);
  });

  it('renames person and syncs roster.name', async () => {
    const { db } = setupTestDb();
    const { createEvent } = await import('../src/services/event.service.js');
    const { createTeam, addRosterMembers } = await import('../src/services/game-ops.service.js');

    const evt = await createEvent(db, '改名测试');
    const team = await createTeam(db, evt.id, { name: '红队' });
    const [player] = await addRosterMembers(db, team.id, { names: ['微信昵称'] });

    const updated = await renamePerson(db, player!.personId, '张三丰');
    expect(updated.displayName).toBe('张三丰');

    const [rosterRow] = await db.select().from(rosters).where(eq(rosters.id, player!.id));
    expect(rosterRow!.name).toBe('张三丰');
  });

  it('rejects rename for missing person', async () => {
    const { db } = setupTestDb();
    await expect(renamePerson(db, 'missing-id', '张三')).rejects.toThrow('Person not found');
  });
});
