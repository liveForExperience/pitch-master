import type { ComponentPropsWithoutRef } from 'react';
import { CaretRight } from '@phosphor-icons/react';
import type { IconProps } from '@phosphor-icons/react';
import { cn } from '../../lib/cn';
import { PagePanel, PagePanelBody } from './page-panel';

type IconComponent = React.ComponentType<IconProps>;

const toneStyles = {
  neutral: {
    icon: 'text-textSec',
    title: 'text-textPri',
  },
  warning: {
    icon: 'text-warning',
    title: 'text-textPri',
  },
  danger: {
    icon: 'text-danger',
    title: 'text-danger',
  },
} as const;

export function DangerZone({
  hint,
  layout = 'stack',
  children,
  className,
}: {
  hint?: string;
  layout?: 'grid' | 'stack';
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <PagePanel className={className}>
      {hint && (
        <PagePanelBody className="border-b border-border py-3">
          <p className="text-xs leading-relaxed text-textSec">{hint}</p>
        </PagePanelBody>
      )}
      {layout === 'grid' ? (
        <PagePanelBody className="grid grid-cols-2 gap-2">{children}</PagePanelBody>
      ) : (
        <PagePanelBody>{children}</PagePanelBody>
      )}
    </PagePanel>
  );
}

export function DangerActionTile({
  icon: Icon,
  title,
  onClick,
  disabled,
  tone = 'neutral',
  className,
  ...props
}: {
  icon: IconComponent;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: keyof typeof toneStyles;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'button'>, 'onClick' | 'children' | 'className' | 'type' | 'disabled'>) {
  const styles = toneStyles[tone];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex min-h-[4.5rem] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-border px-2 py-3 text-center transition-colors active:bg-elevated/80 disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <Icon size={22} weight="bold" className={styles.icon} aria-hidden />
      <span className={cn('text-sm font-semibold leading-tight', styles.title)}>{title}</span>
    </button>
  );
}

export function DangerActionRow({
  icon: Icon,
  title,
  description,
  onClick,
  disabled,
  tone = 'neutral',
  className,
  ...props
}: {
  icon: IconComponent;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: keyof typeof toneStyles;
  className?: string;
} & Omit<ComponentPropsWithoutRef<'button'>, 'onClick' | 'children' | 'className' | 'type' | 'disabled'>) {
  const styles = toneStyles[tone];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 py-1 text-left transition-colors active:opacity-80 disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          styles.icon,
        )}
        aria-hidden
      >
        <Icon size={20} weight="bold" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-sm font-semibold', styles.title)}>{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-textSec">{description}</span>
      </span>
      <CaretRight size={16} weight="bold" className="shrink-0 text-textSec" aria-hidden />
    </button>
  );
}
