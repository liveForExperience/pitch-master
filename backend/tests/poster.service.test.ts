import { describe, expect, it } from 'vitest';
import { createEvent } from '../src/services/event.service.js';
import {
  addRosterMembers,
  createGame,
  createTeam,
  finishGame,
  recordGameEvent,
  startGame,
} from '../src/services/game-ops.service.js';
import { getEventReport } from '../src/services/report.service.js';
import {
  estimateEventPosterHeight,
  isPngBuffer,
  renderEventPosterPng,
  renderGamePosterPng,
} from '../src/services/poster.service.js';
import { resetPosterCacheForTests } from '../src/lib/poster-cache.js';
import { setupTestDb } from './helpers/test-db.js';

describe('poster.service', () => {
  async function seedFinishedMatch() {
    const { db } = setupTestDb();
    resetPosterCacheForTests();
    const evt = await createEvent(db, '海报测试活动');
    const teamA = await createTeam(db, evt.id, { name: '红队' });
    const teamB = await createTeam(db, evt.id, { name: '蓝队' });
    const [scorer] = await addRosterMembers(db, teamA.id, ['陈宇']);
    const [assist] = await addRosterMembers(db, teamA.id, ['王勇']);
    await addRosterMembers(db, teamB.id, ['李雷']);
    const game = await createGame(db, evt.id, { teamAId: teamA.id, teamBId: teamB.id });
    await startGame(db, game.id);
    await recordGameEvent(db, game.id, {
      clientEventId: 'pg1',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: scorer!.id,
      assistantRosterId: assist!.id,
      clientTs: Date.now(),
    });
    await finishGame(db, game.id);
    return { db, evt, game };
  }

  it('estimateEventPosterHeight grows with content rows', () => {
    const base = {
      event: { id: 'e', shortCode: 'ABC', name: '测试', createdAt: 1, finishedAt: null },
      games: [],
      standings: [],
      topScorers: [],
      topAssists: [],
      meta: { topN: 5, generatedAt: 1 },
    };
    const empty = estimateEventPosterHeight(base);
    const full = estimateEventPosterHeight({
      ...base,
      games: [{ id: 'g', teamA: { id: 'a', name: 'A', colorHex: '#f00' }, teamB: { id: 'b', name: 'B', colorHex: '#00f' }, scoreA: 1, scoreB: 0, status: 'FINISHED', durationMs: 1000 }],
      standings: [{ teamId: 'a', teamName: 'A', colorHex: '#f00', played: 1, wins: 1, draws: 0, losses: 0, goalsFor: 1, goalsAgainst: 0, goalDiff: 1, points: 3, rank: 1 }],
      topScorers: [{ rosterId: 'p', name: '陈', teamId: 'a', teamName: 'A', colorHex: '#f00', goals: 1, firstGoalAt: 1 }],
      mvp: { rosterId: 'p', name: '陈', teamName: 'A', colorHex: '#f00', goals: 1, assists: 0 },
    });
    expect(full).toBeGreaterThan(empty);
  });

  it('renders event and game poster PNG buffers', async () => {
    const { db, evt, game } = await seedFinishedMatch();
    const eventPng = await renderEventPosterPng(db, evt.shortCode, 5);
    const gamePng = await renderGamePosterPng(db, game.id);

    expect(isPngBuffer(eventPng)).toBe(true);
    expect(isPngBuffer(gamePng)).toBe(true);
    expect(eventPng.byteLength).toBeGreaterThan(1000);
    expect(gamePng.byteLength).toBeGreaterThan(1000);
  });

  it('caches event poster by event revision key', async () => {
    const { db, evt } = await seedFinishedMatch();
    const first = await renderEventPosterPng(db, evt.id, 5);
    const second = await renderEventPosterPng(db, evt.id, 5);
    expect(second.equals(first)).toBe(true);
  });

  it('builds report data used by poster templates', async () => {
    const { db, evt } = await seedFinishedMatch();
    const report = await getEventReport(db, evt.shortCode, 5);
    expect(report.topScorers.length).toBeGreaterThan(0);
    expect(report.standings.length).toBe(2);
  });
});
