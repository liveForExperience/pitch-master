import { beforeAll, describe, expect, it } from 'vitest';
import {
  deriveShootoutView,
  findLastActiveScorable,
  formatGameEventLabel,
  getUndoneEventIds,
  hasActiveScorable,
  listActiveScorableEvents,
} from './game-events';
import type { GameDetail } from '../api/types';
import { __resetLocaleForTests } from '../i18n';

beforeAll(() => __resetLocaleForTests('zh'));

const baseGame = {
  teamA: { id: 't1', name: '红队', colorHex: '#f00', roster: [{ id: 'p1', name: '张三', jerseyNumber: null }] },
  teamB: { id: 't2', name: '蓝队', colorHex: '#00f', roster: [{ id: 'p2', name: '李四', jerseyNumber: null }] },
} as Pick<GameDetail, 'teamA' | 'teamB'>;

describe('game-events semantics', () => {
  const events: GameDetail['events'] = [
    {
      id: 'g1',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: 'p1',
      assistantRosterId: 'p2',
      undoTargetEventId: null,
      serverTs: 1,
    },
    {
      id: 'g2',
      type: 'GOAL',
      teamSide: 'B',
      scorerRosterId: 'p2',
      assistantRosterId: null,
      undoTargetEventId: null,
      serverTs: 2,
    },
    {
      id: 'u1',
      type: 'UNDO',
      teamSide: null,
      scorerRosterId: null,
      assistantRosterId: null,
      undoTargetEventId: 'g1',
      serverTs: 3,
    },
  ];

  it('lists only active scorable events newest first', () => {
    const active = listActiveScorableEvents(events);
    expect(active.map((e) => e.id)).toEqual(['g2']);
  });

  it('finds last active scorable', () => {
    expect(findLastActiveScorable(events)?.id).toBe('g2');
  });

  it('tracks undone ids', () => {
    expect(getUndoneEventIds(events)).toEqual(new Set(['g1']));
  });

  it('hasActiveScorable reflects remaining goals', () => {
    expect(hasActiveScorable(events)).toBe(true);
    expect(hasActiveScorable(events.filter((e) => e.id !== 'g2'))).toBe(false);
  });

  it('formats goal labels with assist', () => {
    const names = new Map([
      ['p1', '张三'],
      ['p2', '李四'],
    ]);
    const label = formatGameEventLabel(events[0]!, names, baseGame.teamA?.name, baseGame.teamB?.name);
    expect(label).toBe('红队 张三 进球（助攻 李四）');
  });

  it('formats own-goal with named scorer as "<player> 乌龙"', () => {
    const names = new Map([['p2', '李四']]);
    const own: GameDetail['events'][number] = {
      id: 'og1',
      type: 'OWN_GOAL',
      teamSide: 'B',
      scorerRosterId: 'p2',
      assistantRosterId: null,
      undoTargetEventId: null,
      serverTs: 5,
    };
    const label = formatGameEventLabel(own, names, baseGame.teamA?.name, baseGame.teamB?.name);
    expect(label).toBe('李四 乌龙');
  });
});

describe('deriveShootoutView', () => {
  const eventsWithFirstKickerB: GameDetail['events'] = [
    {
      id: 'k1',
      type: 'PENALTY_MADE',
      teamSide: 'B',
      scorerRosterId: null,
      assistantRosterId: null,
      undoTargetEventId: null,
      serverTs: 10,
    },
  ];

  it('derives firstKicker from the first active kick', () => {
    const view = deriveShootoutView(eventsWithFirstKickerB);
    expect(view.firstKicker).toBe('B');
    // After B kicks once, next side should be A (roles swap).
    expect(view.nextSide).toBe('A');
  });

  it('honors preferredFirst before any kicks exist', () => {
    const viewA = deriveShootoutView([], 'A');
    expect(viewA.nextSide).toBe('A');
    const viewB = deriveShootoutView([], 'B');
    expect(viewB.nextSide).toBe('B');
  });

  it('marks ended=true when a SHOOTOUT_END event is active', () => {
    const events: GameDetail['events'] = [
      ...eventsWithFirstKickerB,
      {
        id: 'a1',
        type: 'PENALTY_MISSED',
        teamSide: 'A',
        scorerRosterId: null,
        assistantRosterId: null,
        undoTargetEventId: null,
        serverTs: 11,
      },
      {
        id: 'end1',
        type: 'SHOOTOUT_END',
        teamSide: null,
        scorerRosterId: null,
        assistantRosterId: null,
        undoTargetEventId: null,
        serverTs: 12,
      },
    ];
    const view = deriveShootoutView(events);
    expect(view.ended).toBe(true);
    expect(view.nextSide).toBeNull();
    expect(view.canEnd).toBe(false);
  });
});
