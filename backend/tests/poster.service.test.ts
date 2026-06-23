import { afterEach, describe, expect, it, vi } from 'vitest';
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
import { resetPosterEmojiCacheForTests } from '../src/services/poster-emoji.js';
import { setupTestDb } from './helpers/test-db.js';

describe('poster.service', () => {
  afterEach(() => {
    resetPosterEmojiCacheForTests();
    vi.restoreAllMocks();
  });
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

  it('estimateEventPosterHeight returns fixed 4:5 by default and 4:6 when data is heavy', () => {
    const base = {
      event: { id: 'e', shortCode: 'ABC', name: '测试', createdAt: 1, finishedAt: null },
      games: [],
      standings: [],
      topScorers: [],
      topAssists: [],
      meta: { topN: 5, generatedAt: 1 },
    };
    const lean = estimateEventPosterHeight(base);
    const heavy = estimateEventPosterHeight({
      ...base,
      topScorers: Array.from({ length: 5 }).map((_, i) => ({
        rosterId: `p${i}`,
        name: `球员${i}`,
        teamId: 'a',
        teamName: 'A',
        colorHex: '#f00',
        goals: 20,
        firstGoalAt: 1,
      })),
    });
    expect(lean).toBe(1350);
    expect(heavy).toBe(1620);
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

  it('renders poster with emoji and special Chinese characters in event name', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="#f00"/></svg>',
      }),
    );
    const { db } = setupTestDb();
    resetPosterCacheForTests();
    const evt = await createEvent(db, '《周末赛》𠮷太郎🎉');
    const teamA = await createTeam(db, evt.id, { name: '红队⚽' });
    const teamB = await createTeam(db, evt.id, { name: '蓝队' });
    await addRosterMembers(db, teamA.id, ['陈宇']);
    await addRosterMembers(db, teamB.id, ['李雷']);
    const game = await createGame(db, evt.id, { teamAId: teamA.id, teamBId: teamB.id });
    await startGame(db, game.id);
    await finishGame(db, game.id);

    const png = await renderEventPosterPng(db, evt.shortCode, 5);
    expect(isPngBuffer(png)).toBe(true);
    expect(png.byteLength).toBeGreaterThan(1000);
  });
});
