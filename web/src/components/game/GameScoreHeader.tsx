import type { GameDetail } from '../../api/types';
import { StatusChip } from '../ui/status-chip';
import { useT } from '../../i18n';
import { gameStatusLabel } from '../../lib/report-display';
import { gameStatusVariant } from '../../lib/game-status-ui';
import { formatMs } from '../../lib/time-format';
import type { LiveTimer } from '../../lib/use-live-game-timer';

export function GameScoreHeader({
  game,
  timer,
}: {
  game: GameDetail;
  timer: LiveTimer | null;
}) {
  const t = useT();
  const teamA = game.teamA ?? { name: 'A', colorHex: '#64748b' };
  const teamB = game.teamB ?? { name: 'B', colorHex: '#64748b' };
  const status = game.game.status;

  const timerLine =
    timer && status === 'FINISHED'
      ? t('detail.finished', { elapsed: formatMs(timer.elapsedMs) })
      : timer
        ? t('detail.elapsed', {
            elapsed: formatMs(timer.elapsedMs),
            planned: formatMs(timer.plannedDurationMs),
          })
        : null;

  return (
    <header className="px-4 py-6 text-center">
      <div className="mb-4 flex items-center justify-center">
        <StatusChip label={gameStatusLabel(status, t)} variant={gameStatusVariant(status)} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span
            className="h-8 w-1 shrink-0 rounded-sm"
            style={{ backgroundColor: teamA.colorHex }}
            aria-hidden
          />
          <span className="truncate text-sm font-semibold text-textPri">{teamA.name}</span>
        </div>
        <div className="shrink-0 font-score tabular-nums text-score text-textPri">
          {game.scoreA} : {game.scoreB}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-sm font-semibold text-textPri">{teamB.name}</span>
          <span
            className="h-8 w-1 shrink-0 rounded-sm"
            style={{ backgroundColor: teamB.colorHex }}
            aria-hidden
          />
        </div>
      </div>

      {timerLine && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-textSec">
          {timerLine}
        </p>
      )}
    </header>
  );
}
