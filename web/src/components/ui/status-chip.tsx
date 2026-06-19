import { cn } from '../../lib/cn';

export type ChipVariant =
  | 'win'
  | 'draw'
  | 'loss'
  | 'playing'
  | 'paused'
  | 'finished'
  | 'ready'
  | 'neutral';

const variantClass: Record<ChipVariant, string> = {
  win: 'bg-primary/15 text-primaryDk',
  draw: 'bg-chipBg text-textSec',
  loss: 'bg-danger/10 text-danger',
  playing: 'bg-primary/15 text-primaryDk',
  paused: 'bg-warning/15 text-warning',
  finished: 'bg-chipBg text-textSec',
  ready: 'bg-chipBg text-textSec',
  neutral: 'bg-chipBg text-textSec',
};

export function StatusChip({
  label,
  variant = 'neutral',
  className,
}: {
  label: string;
  variant?: ChipVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center rounded-full px-3 py-0.5 text-caption font-semibold',
        variantClass[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}
