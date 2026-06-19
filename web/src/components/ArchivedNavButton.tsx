import { Link } from 'react-router-dom';
import { Archive } from '@phosphor-icons/react';
import { useT } from '../i18n';
import { cn } from '../lib/cn';
import { useSessionStore } from '../stores/session';

export function ArchivedNavButton({ className }: { className?: string }) {
  const t = useT();
  const count = useSessionStore((s) => s.archivedEvents.length);

  return (
    <Link
      to="/archived"
      aria-label={t('archived.openLabel')}
      title={t('archived.navTooltip')}
      className={cn(
        'relative inline-flex h-10 w-10 items-center justify-center rounded-full text-textSec active:bg-elevated',
        className,
      )}
    >
      <Archive size={20} weight="duotone" />
      {count > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-textInv">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
