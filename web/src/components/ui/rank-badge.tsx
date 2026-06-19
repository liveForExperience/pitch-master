import { cn } from '../../lib/cn';

export function RankBadge({ rank, className }: { rank: number; className?: string }) {
  const topThree = rank >= 1 && rank <= 3;
  return (
    <span
      className={cn(
        'inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-2 text-caption font-bold tabular-nums',
        topThree ? 'bg-primary text-textInv' : 'bg-chipBg text-textSec',
        className,
      )}
    >
      {rank}
    </span>
  );
}
