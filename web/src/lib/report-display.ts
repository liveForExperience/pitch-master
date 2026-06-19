import { t as defaultT } from '../i18n';

export type MatchResult = 'A_WIN' | 'B_WIN' | 'DRAW' | 'PENDING';

type T = (key: string, params?: Record<string, string | number>) => string;

export function getMatchResult(
  scoreA: number,
  scoreB: number,
  status: string,
): MatchResult {
  if (status !== 'FINISHED') return 'PENDING';
  if (scoreA > scoreB) return 'A_WIN';
  if (scoreA < scoreB) return 'B_WIN';
  return 'DRAW';
}

export function matchResultLabel(
  result: MatchResult,
  teamName?: string,
  t: T = defaultT,
): string {
  switch (result) {
    case 'A_WIN':
      return teamName ? t('result.win', { team: teamName }) : t('result.winA');
    case 'B_WIN':
      return teamName ? t('result.win', { team: teamName }) : t('result.winB');
    case 'DRAW':
      return t('result.draw');
    default:
      return t('result.pending');
  }
}

export function gameStatusLabel(status: string, t: T = defaultT): string {
  switch (status) {
    case 'READY':
    case 'PLAYING':
    case 'PAUSED':
    case 'FINISHED':
      return t(`status.${status}`);
    default:
      return status;
  }
}
