import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createEvent } from '../src/services/event.service.js';
import { rosters, teams } from '../src/db/schema.js';
import {
  addRosterMembers,
  createGame,
  createTeam,
  recordGameEvent,
  removeRosterMember,
  startGame,
  updateTeam,
} from '../src/services/game-ops.service.js';
import { setupTestDb } from './helpers/test-db.js';
import { createPerson } from '../src/services/person.service.js';

describe('roster-ops.service', () => {
  it('updates team name', async () => {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '队名测试');
    const team = await createTeam(db, evt.id, { name: '红队' });

    const updated = await updateTeam(db, team.id, { name: ' 烈焰红 ' });
    expect(updated.name).toBe('烈焰红');

    const [row] = await db.select().from(teams).where(eq(teams.id, team.id));
    expect(row!.name).toBe('烈焰红');
  });

  it('removes roster member when no game events reference them', async () => {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '移除测试');
    const team = await createTeam(db, evt.id, { name: 'A' });
    const [player] = await addRosterMembers(db, team.id, { names: ['张三'] });

    const removed = await removeRosterMember(db, player!.id);
    expect(removed).toMatchObject({ id: player!.id, name: '张三', teamId: team.id });

    const rows = await db.select().from(rosters).where(eq(rosters.teamId, team.id));
    expect(rows).toHaveLength(0);
  });

  it('blocks roster removal when referenced by game events', async () => {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '引用测试');
    const teamA = await createTeam(db, evt.id, { name: '红' });
    const teamB = await createTeam(db, evt.id, { name: '蓝' });
    const [player] = await addRosterMembers(db, teamA.id, { names: ['甲'] });
    const game = await createGame(db, evt.id, { teamAId: teamA.id, teamBId: teamB.id });
    await startGame(db, game.id);
    await recordGameEvent(db, game.id, {
      clientEventId: 'g1',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: player!.id,
      clientTs: Date.now(),
    });

    await expect(removeRosterMember(db, player!.id)).rejects.toThrow(
      'Cannot remove player with recorded game events',
    );
  });

  it('blocks adding same person twice on one team', async () => {
    const { db } = setupTestDb();
    const evt = await createEvent(db, '重复测试');
    const team = await createTeam(db, evt.id, { name: 'A' });
    const person = await createPerson(db, '张三');
    await addRosterMembers(db, team.id, { personIds: [person.id] });
    await expect(addRosterMembers(db, team.id, { personIds: [person.id] })).rejects.toThrow(
      'Person already on this team',
    );
  });
});
