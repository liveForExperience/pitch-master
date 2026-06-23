import { describe, expect, it } from 'vitest';
import type { Team } from '../api/types';
import { mergeIntoPool, nameReturnsToPool } from './roster-pool';

describe('roster-pool', () => {
  const teams: Team[] = [
    {
      id: 't1',
      name: 'A',
      colorHex: '#000',
      roster: [{ id: 'p1', name: '张三', personId: 'person1', jerseyNumber: null }],
    },
    {
      id: 't2',
      name: 'B',
      colorHex: '#fff',
      roster: [{ id: 'p2', name: '李四', personId: 'person2', jerseyNumber: null }],
    },
  ];

  it('returns true when player is not on another team', () => {
    expect(nameReturnsToPool('张三', teams, 't1')).toBe(true);
  });

  it('returns false when same name remains on another team', () => {
    const both = [
      teams[0],
      {
        ...teams[1],
        roster: [
          { id: 'p2', name: '李四', personId: 'person2', jerseyNumber: null },
          { id: 'p3', name: '张三', personId: 'person3', jerseyNumber: null },
        ],
      },
    ];
    expect(nameReturnsToPool('张三', both, 't1')).toBe(false);
  });

  it('merges unique names into pool', () => {
    expect(mergeIntoPool(['甲'], '乙')).toEqual(['甲', '乙']);
    expect(mergeIntoPool(['甲'], '甲')).toEqual(['甲']);
  });
});
