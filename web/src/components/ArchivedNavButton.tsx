import { Link } from 'react-router-dom';
import { Archive } from '@phosphor-icons/react';
import { useT } from '../i18n';
import { cn } from '../lib/cn';
import { useSessionStore } from '../stores/session';
import { unreadArchivedCount } from '../stores/session-logic';

export function ArchivedNavButton({ className }: { className?: string }) {
  const t = useT();
  const archivedCount = useSessionStore((s) => s.archivedEvents.length);
  const seenCount = useSessionStore((s) => s.archivedSeenCount);
  const unread = unreadArchivedCount(archivedCount, seenCount);

  return (
    <Link
      to="/archived"
      data-tour="nav-archived"
      aria-label={t('archived.openLabel')}
      title={
        unread > 0
          ? t('archived.navTooltipWithCount', { count: unread })
          : t('archived.navTooltip')
      }
      className={cn(
        'relative inline-flex h-10 w-10 items-center justify-center rounded-full text-textSec active:bg-elevated',
        className,
      )}
    >
      <Archive size={20} weight="duotone" />
      {unread > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-textInv">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}
