import { beforeAll, describe, expect, it } from 'vitest';
import {
  gameStatusLabel,
  getMatchResult,
  matchResultLabel,
} from './report-display';
import { __resetLocaleForTests } from '../i18n';

describe('report-display', () => {
  it('derives match result only when finished', () => {
    expect(getMatchResult(2, 1, 'FINISHED')).toBe('A_WIN');
    expect(getMatchResult(1, 1, 'FINISHED')).toBe('DRAW');
    expect(getMatchResult(0, 1, 'PLAYING')).toBe('PENDING');
  });

  describe('zh locale', () => {
    beforeAll(() => __resetLocaleForTests('zh'));

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

  describe('en locale', () => {
    beforeAll(() => __resetLocaleForTests('en'));

    it('labels match results in English', () => {
      expect(matchResultLabel('A_WIN', 'Reds')).toBe('Reds wins');
      expect(matchResultLabel('DRAW')).toBe('Draw');
      expect(matchResultLabel('PENDING')).toBe('In progress');
    });

    it('maps game status to English labels', () => {
      expect(gameStatusLabel('PAUSED')).toBe('Paused');
      expect(gameStatusLabel('FINISHED')).toBe('Finished');
    });
  });
});
