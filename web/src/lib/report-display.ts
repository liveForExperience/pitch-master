import { t as defaultT } from '../i18n';

export type MatchResult = 'A_WIN' | 'B_WIN' | 'DRAW' | 'PENDING';

type T = (key: string, params?: Record<string, string | number>) => string;

export type ShootoutSummary = {
  madeA: number;
  madeB: number;
  winner: 'A' | 'B' | null;
  ended: boolean;
} | null;

export function getMatchResult(
  scoreA: number,
  scoreB: number,
  status: string,
  shootout?: ShootoutSummary,
): MatchResult {
  if (status !== 'FINISHED') return 'PENDING';
  if (scoreA > scoreB) return 'A_WIN';
  if (scoreA < scoreB) return 'B_WIN';
  // `winner` is set whenever the shootout has a current leader
  // (equal rounds, made counts differ). We intentionally do NOT
  // require `ended` — otherwise a shootout without SHOOTOUT_END
  // stays "draw" in standings and reports, which is misleading.
  if (shootout?.winner === 'A') return 'A_WIN';
  if (shootout?.winner === 'B') return 'B_WIN';
  return 'DRAW';
}

/**
 * Compose the two team scores + optional shootout tally into a
 * single string like `1(5) : 1(4)`. Regulation score always shown;
 * shootout counts appear in parentheses if any kick has been recorded.
 *
 * Returned as `{ a, b, sep }` so callers can style each cell independently.
 */
export function formatFinalScoreParts(
  scoreA: number,
  scoreB: number,
  shootout: ShootoutSummary,
): { a: string; b: string; hasShootout: boolean } {
  const hasShootout = Boolean(shootout && (shootout.madeA + shootout.madeB > 0));
  if (!hasShootout) return { a: String(scoreA), b: String(scoreB), hasShootout: false };
  return {
    a: `${scoreA}(${shootout!.madeA})`,
    b: `${scoreB}(${shootout!.madeB})`,
    hasShootout: true,
  };
}

/** Compact one-string version, e.g. `1(5):1(4)`. */
export function formatFinalScoreString(
  scoreA: number,
  scoreB: number,
  shootout: ShootoutSummary,
  separator = ':',
): string {
  const parts = formatFinalScoreParts(scoreA, scoreB, shootout);
  return `${parts.a}${separator}${parts.b}`;
}

/**
 * Small secondary badge, e.g. `点球 5 - 4`. Returns null when there is no
 * shootout activity so callers can conditionally render.
 *
 * Rationale: mainstream football UIs (UEFA / Opta / FotMob) keep the
 * regulation score at its natural size and render the shootout tally as
 * a smaller, muted line — never as `1(5):1(4)` — because tight parens
 * next to the primary digits are hard to scan.
 */
export function formatShootoutBadge(
  shootout: ShootoutSummary,
  t: T = defaultT,
): string | null {
  if (!shootout) return null;
  if (shootout.madeA + shootout.madeB === 0) return null;
  return t('score.shootoutBadge', { a: shootout.madeA, b: shootout.madeB });
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
