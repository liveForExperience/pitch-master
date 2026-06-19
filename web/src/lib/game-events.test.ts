import { beforeAll, describe, expect, it } from 'vitest';
import {
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
      clientEventId: 'c-g1',
      type: 'GOAL',
      teamSide: 'A',
      scorerRosterId: 'p1',
      assistantRosterId: 'p2',
      undoTargetEventId: null,
      serverTs: 1,
    },
    {
      id: 'g2',
      clientEventId: 'c-g2',
      type: 'GOAL',
      teamSide: 'B',
      scorerRosterId: 'p2',
      assistantRosterId: null,
      undoTargetEventId: null,
      serverTs: 2,
    },
    {
      id: 'u1',
      clientEventId: 'c-u1',
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
});
