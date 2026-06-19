import { type ReactNode } from 'react';
import { Eyebrow } from './layout';
import { ShareReportButton } from './ShareReportButton';
import type { ShareReportInput } from '../../lib/share-report';
import { useT } from '../../i18n';
import { cn } from '../../lib/cn';

/**
 * Editorial hero for both `/events/:code/report` and `/games/:id/report`.
 */
export function ReportHero({
  eyebrow,
  title,
  subtitle,
  stats,
  share,
  shareLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  stats?: Array<{ label: string; value: ReactNode; danger?: boolean }>;
  share?: ShareReportInput;
  shareLabel?: string;
  children?: ReactNode;
}) {
  const t = useT();
  const effectiveLabel = shareLabel ?? t('share.label');

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

      {share && (
        <ShareReportButton
          share={share}
          variant="primary"
          className="pt-1"
          label={effectiveLabel}
        />
      )}
    </header>
  );
}
