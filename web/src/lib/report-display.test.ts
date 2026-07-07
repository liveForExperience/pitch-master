import { beforeAll, describe, expect, it } from 'vitest';
import {
  formatFinalScoreParts,
  formatFinalScoreString,
  formatShootoutBadge,
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

  it('shootout with a current leader decides a drawn regulation', () => {
    // ended=true — locked shootout, clearly A wins.
    expect(
      getMatchResult(1, 1, 'FINISHED', {
        madeA: 5,
        madeB: 4,
        winner: 'A',
        ended: true,
      }),
    ).toBe('A_WIN');
    // ended=false — admin never pressed "End shootout", but the leader
    // is unambiguous. Standings must still credit A.
    expect(
      getMatchResult(1, 1, 'FINISHED', {
        madeA: 5,
        madeB: 4,
        winner: 'A',
        ended: false,
      }),
    ).toBe('A_WIN');
    // No leader (equal makes) → DRAW.
    expect(
      getMatchResult(0, 0, 'FINISHED', {
        madeA: 1,
        madeB: 1,
        winner: null,
        ended: false,
      }),
    ).toBe('DRAW');
  });

  it('formatFinalScoreParts appends shootout tally only when kicks recorded', () => {
    expect(formatFinalScoreParts(2, 1, null)).toEqual({
      a: '2',
      b: '1',
      hasShootout: false,
    });
    expect(
      formatFinalScoreParts(1, 1, {
        madeA: 5,
        madeB: 4,
        winner: 'A',
        ended: true,
      }),
    ).toEqual({ a: '1(5)', b: '1(4)', hasShootout: true });
  });

  it('formatFinalScoreString joins parts with the given separator', () => {
    expect(
      formatFinalScoreString(1, 1, {
        madeA: 5,
        madeB: 4,
        winner: 'A',
        ended: true,
      }),
    ).toBe('1(5):1(4)');
  });

  describe('formatShootoutBadge', () => {
    beforeAll(() => __resetLocaleForTests('zh'));
    it('returns null when there is no shootout activity', () => {
      expect(formatShootoutBadge(null)).toBeNull();
      expect(
        formatShootoutBadge({ madeA: 0, madeB: 0, winner: null, ended: false }),
      ).toBeNull();
    });
    it('returns a labeled tally when kicks exist', () => {
      expect(
        formatShootoutBadge({ madeA: 5, madeB: 4, winner: 'A', ended: true }),
      ).toBe('点球 5 - 4');
    });
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
