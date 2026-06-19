import { cn } from '../../lib/cn';
import { RankBadge } from './rank-badge';
import { TeamBadge } from './team-badge';

export function StatRow({
  rank,
  name,
  teamName,
  teamColorHex,
  value,
  valueLabel,
  zebra,
  className,
}: {
  rank: number;
  name: string;
  teamName: string;
  teamColorHex: string;
  value: number;
  valueLabel?: string;
  zebra?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-h-14 items-center gap-3 rounded-xl px-3 py-2',
        zebra && 'bg-chipBg/50',
        className,
      )}
    >
      <RankBadge rank={rank} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-textPri">{name}</p>
        <TeamBadge name={teamName} colorHex={teamColorHex} className="text-caption" />
      </div>
      <div className="text-right tabular-nums">
        <p className="text-h2 font-bold text-textPri">{value}</p>
        {valueLabel && <p className="text-caption text-textSec">{valueLabel}</p>}
      </div>
    </div>
  );
}
