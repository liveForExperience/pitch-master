import { cn } from '../../lib/cn';

export function TeamBadge({
  name,
  colorHex,
  className,
}: {
  name: string;
  colorHex: string;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex min-h-[1.75rem] items-center gap-2', className)}>
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: colorHex }}
        aria-hidden
      />
      <span className="truncate text-body font-medium text-textPri">{name}</span>
    </span>
  );
}
