import { Link } from 'react-router-dom';
import { UserGear } from '@phosphor-icons/react';
import { useT } from '../i18n';
import { cn } from '../lib/cn';

export function RestoreNavButton({ className }: { className?: string }) {
  const t = useT();

  return (
    <Link
      to="/admin/restore"
      aria-label={t('restore.openLabel')}
      title={t('restore.navTooltip')}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full text-textSec active:bg-elevated',
        className,
      )}
    >
      <UserGear size={20} weight="duotone" />
    </Link>
  );
}
