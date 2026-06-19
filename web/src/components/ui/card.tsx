import { cn } from '../../lib/cn';

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border bg-surface p-6 shadow-sm',
        className,
      )}
    >
      {children}
    </section>
  );
}
