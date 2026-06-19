import { describe, expect, it } from 'vitest';
import {
  canCreateGame,
  resolveOtherTeamId,
  teamOptionsForSide,
} from './new-game-teams';

const teams = [
  { id: 'a', name: '红' },
  { id: 'b', name: '蓝' },
  { id: 'c', name: '绿' },
];

describe('new-game-teams', () => {
  it('excludes the opponent from each dropdown', () => {
    expect(teamOptionsForSide(teams, 'a').map((t) => t.id)).toEqual(['b', 'c']);
    expect(teamOptionsForSide(teams, 'b').map((t) => t.id)).toEqual(['a', 'c']);
  });

  it('auto-picks an alternate when sides collide', () => {
    expect(resolveOtherTeamId(teams, 'a', 'a')).toBe('b');
    expect(resolveOtherTeamId(teams, 'b', 'a')).toBe('a');
  });

  it('blocks create when sides match or fewer than two teams', () => {
    expect(canCreateGame('a', 'b', 2)).toBe(true);
    expect(canCreateGame('a', 'a', 2)).toBe(false);
    expect(canCreateGame('a', 'b', 1)).toBe(false);
  });
});
