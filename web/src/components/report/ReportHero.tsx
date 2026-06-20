import { type ReactNode } from 'react';
import { Eyebrow } from './layout';
import { cn } from '../../lib/cn';

/**
 * Editorial hero for both `/events/:code/report` and `/games/:id/report`.
 *
 * The hero used to host a "分享战报" button, but the poster section below
 * now owns all share / copy / save flows via the lightbox — keeping a
 * separate top-level share CTA only confused users about which path saves
 * the actual image. The hero is intentionally action-free now.
 */
export function ReportHero({
  eyebrow,
  title,
  subtitle,
  stats,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  stats?: Array<{ label: string; value: ReactNode; danger?: boolean }>;
  children?: ReactNode;
}) {
  return (
    <header className="space-y-5">
      <Eyebrow>{eyebrow}</Eyebrow>

      <h1 className="text-[40px] font-bold leading-[1.05] tracking-[-0.02em] text-textPri">
        {title}
      </h1>
      {subtitle && <div className="text-body text-textSec">{subtitle}</div>}

      {children}

      {stats && stats.length > 0 && (
        <div className="grid grid-cols-3 border-y border-border">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                'flex flex-col items-center gap-2 py-4',
                i > 0 && 'border-l border-border',
              )}
            >
              <span
                className={cn(
                  'font-mono text-3xl font-medium leading-none tracking-tight tabular-nums',
                  s.danger ? 'text-danger' : 'text-textPri',
                )}
              >
                {s.value}
              </span>
              <Eyebrow>{s.label}</Eyebrow>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
