import { describe, expect, it } from 'vitest';
import {
  gameStatusLabel,
  getMatchResult,
  matchResultLabel,
} from './report-display';

describe('report-display', () => {
  it('derives match result only when finished', () => {
    expect(getMatchResult(2, 1, 'FINISHED')).toBe('A_WIN');
    expect(getMatchResult(1, 1, 'FINISHED')).toBe('DRAW');
    expect(getMatchResult(0, 1, 'PLAYING')).toBe('PENDING');
  });

  it('labels match results with team name', () => {
    expect(matchResultLabel('A_WIN', '红队')).toBe('红队 胜');
    expect(matchResultLabel('DRAW')).toBe('平局');
    expect(matchResultLabel('PENDING')).toBe('未结束');
  });

  it('maps game status to Chinese labels', () => {
    expect(gameStatusLabel('PAUSED')).toBe('暂停');
    expect(gameStatusLabel('FINISHED')).toBe('已结束');
  });
});
