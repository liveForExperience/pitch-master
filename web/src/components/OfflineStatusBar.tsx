import { useOutboxStore } from '../stores/outbox';
import { useNetworkStore } from '../stores/network';
import { countPendingOutbox } from '../lib/network-probe';

export function OfflineStatusBar() {
  const online = useNetworkStore((s) => s.online);
  const items = useOutboxStore((s) => s.items);
  const flushing = useOutboxStore((s) => s.flushing);
  const pending = countPendingOutbox(items);

  if (online && pending === 0) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 border-b border-border bg-surface/95 px-4 py-2 text-center text-xs text-textSec backdrop-blur"
    >
      {!online && (
        <p className="font-medium text-warning">
          离线模式 · 进球/撤销会暂存本机，恢复网络后自动同步
        </p>
      )}
      {pending > 0 && (
        <p className={online ? 'font-medium text-primary' : 'mt-0.5 text-textSec'}>
          {pending} 条待同步{flushing ? ' · 同步中…' : online ? ' · 联网后将自动上传' : ''}
        </p>
      )}
    </div>
  );
}
