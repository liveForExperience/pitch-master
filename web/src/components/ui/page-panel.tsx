import { cn } from '../../lib/cn';

export function PagePanel({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLElement> & { children: React.ReactNode }) {
  return (
    <section
      {...rest}
      className={cn('overflow-hidden rounded-xl border border-border bg-surface', className)}
    >
      {children}
    </section>
  );
}

export function PagePanelHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 border-b border-border px-4 py-3.5',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-textPri">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-xs leading-relaxed text-textSec">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function PagePanelBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('px-4 py-4', className)}>{children}</div>;
}
