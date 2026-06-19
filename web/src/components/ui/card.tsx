import { cn } from '../../lib/cn';

export function Card({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLElement> & { children: React.ReactNode }) {
  return (
    <section
      {...rest}
      className={cn(
        'rounded-2xl border border-border bg-surface p-6 shadow-sm',
        className,
      )}
    >
      {children}
    </section>
  );
}
