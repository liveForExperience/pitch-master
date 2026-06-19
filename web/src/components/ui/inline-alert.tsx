import { cn } from '../../lib/cn';

export function InlineAlert({
  children,
  tone = 'danger',
  className,
}: {
  children: React.ReactNode;
  tone?: 'danger' | 'warning' | 'info';
  className?: string;
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-danger/20 bg-danger/5 text-danger'
      : tone === 'warning'
        ? 'border-warning/20 bg-warning/5 text-warning'
        : 'border-primary/20 bg-primary/5 text-textPri';

  return (
    <p className={cn('rounded-lg border px-3 py-2 text-sm', toneClass, className)}>{children}</p>
  );
}
