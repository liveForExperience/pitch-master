import { Trash } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { StatusChip } from '../ui/status-chip';
import { TeamBadge } from '../ui/team-badge';
import { useT } from '../../i18n';
import { gameStatusLabel } from '../../lib/report-display';
import { gameStatusVariant } from '../../lib/game-status-ui';

type Props = {
  gameId: string;
  teamAName: string;
  teamAColor: string;
  teamBName: string;
  teamBColor: string;
  status: string;
  scoreA: number;
  scoreB: number;
  isAdmin: boolean;
  onDelete?: () => void;
};

export function EventGameRow({
  gameId,
  teamAName,
  teamAColor,
  teamBName,
  teamBColor,
  status,
  scoreA,
  scoreB,
  isAdmin,
  onDelete,
}: Props) {
  const t = useT();
  const href = isAdmin ? `/games/${gameId}/record` : `/games/${gameId}`;

  return (
    <li className="flex items-stretch border-b border-border last:border-b-0">
      <Link to={href} className="block min-w-0 flex-1 px-4 py-3.5 active:bg-elevated/80">
        <div className="mb-2 flex items-center justify-between gap-2">
          <StatusChip
            label={gameStatusLabel(status, t)}
            variant={gameStatusVariant(status)}
          />
          <span className="text-xs text-textSec">
            {isAdmin ? t('event.games.tapAdmin') : t('event.games.tapViewer')}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <TeamBadge name={teamAName} colorHex={teamAColor} className="min-w-0 flex-1" />
          <div className="shrink-0 font-score tabular-nums text-[3.2rem] font-semibold leading-none text-textPri">
            {scoreA} : {scoreB}
          </div>
          <TeamBadge
            name={teamBName}
            colorHex={teamBColor}
            className="min-w-0 flex-1 justify-end"
          />
        </div>
      </Link>
      {isAdmin && onDelete && (
        <button
          type="button"
          className="flex w-12 shrink-0 items-center justify-center border-l border-border text-textSec transition-colors hover:bg-danger/5 hover:text-danger"
          aria-label={t('event.games.delete')}
          onClick={onDelete}
        >
          <Trash size={18} weight="bold" />
        </button>
      )}
    </li>
  );
}
