import { useOutboxStore } from '../stores/outbox';
import { useNetworkStore } from '../stores/network';
import { useT } from '../i18n';
import { countPendingOutbox } from '../lib/network-probe';

export function OfflineStatusBar() {
  const t = useT();
  const online = useNetworkStore((s) => s.online);
  const items = useOutboxStore((s) => s.items);
  const flushing = useOutboxStore((s) => s.flushing);
  const pending = countPendingOutbox(items);

  if (online && pending === 0) return null;

  const suffix = flushing
    ? t('offline.lineN.syncing')
    : online
      ? ''
      : t('offline.lineN.willUpload');

  return (
    <div
      role="status"
      className="sticky top-0 z-50 border-b border-border bg-surface/95 px-4 py-2 text-center text-xs text-textSec backdrop-blur"
    >
      {!online && (
        <p className="font-medium text-warning">{t('offline.line1')}</p>
      )}
      {pending > 0 && (
        <p className={online ? 'font-medium text-primary' : 'mt-0.5 text-textSec'}>
          {t('offline.lineN.pending', { count: pending })}
          {suffix}
        </p>
      )}
    </div>
  );
}
