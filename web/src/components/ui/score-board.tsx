import { cn } from '../../lib/cn';
import { TeamBadge } from './team-badge';

export function ScoreBoard({
  teamAName,
  teamAColor,
  teamBName,
  teamBColor,
  scoreA,
  scoreB,
  subtitle,
  className,
}: {
  teamAName: string;
  teamAColor: string;
  teamBName: string;
  teamBColor: string;
  scoreA: number;
  scoreB: number;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn('text-center', className)}>
      <div className="flex items-center justify-between gap-2 px-2">
        <TeamBadge name={teamAName} colorHex={teamAColor} className="flex-1 justify-end" />
        <div className="shrink-0 font-score tabular-nums text-score text-textPri">
          {scoreA} : {scoreB}
        </div>
        <TeamBadge name={teamBName} colorHex={teamBColor} className="flex-1" />
      </div>
      {subtitle && <p className="mt-2 text-caption text-textSec">{subtitle}</p>}
    </div>
  );
}
