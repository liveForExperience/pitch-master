import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Editorial-minimalist building blocks for the H5 report screens.
 *
 * Why a separate module from `components/ui`:
 *   - We deliberately drop the `<Card>` shell here (no shadow, no rounded
 *     surface filler), because the new direction uses hairline borders only.
 *   - Existing pages (HomePage, EventPage, GameRecordPage) still rely on
 *     `<Card>`; phase 4 will revisit those without touching report screens.
 */

export function ReportPageRoot({ children }: { children: ReactNode }) {
  return <div className="space-y-10 pb-12 pt-2">{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex font-mono text-[11px] uppercase tracking-[0.18em] text-textSec',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ReportSection({
  title,
  meta,
  children,
  className,
}: {
  title?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('border-t border-border pt-6', className)}>
      {(title || meta) && (
        <header className="mb-4 flex items-end justify-between gap-3">
          {title && <Eyebrow>{title}</Eyebrow>}
          {meta && <Eyebrow className="text-textSec/80">{meta}</Eyebrow>}
        </header>
      )}
      {children}
    </section>
  );
}

export function HairlineRow({
  children,
  className,
  last,
}: {
  children: ReactNode;
  className?: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 py-3',
        last ? '' : 'border-b border-border',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TeamBar({
  colorHex,
  height = 24,
  width = 4,
  className,
}: {
  colorHex: string;
  height?: number;
  width?: number;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-block shrink-0 rounded-sm', className)}
      style={{ backgroundColor: colorHex, width, height }}
    />
  );
}

export function RankNumeral({ rank, dim = false }: { rank: number; dim?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex w-7 shrink-0 justify-end font-mono text-sm tabular-nums',
        dim ? 'text-textSec' : 'text-textPri',
      )}
    >
      {String(rank).padStart(2, '0')}
    </span>
  );
}

export function MonoNumber({
  children,
  className,
  size = 'sm',
}: {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeCls =
    size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm';
  return (
    <span
      className={cn('font-mono tabular-nums text-textPri', sizeCls, className)}
    >
      {children}
    </span>
  );
}
