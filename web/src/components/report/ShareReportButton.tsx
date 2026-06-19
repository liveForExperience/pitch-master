import { useState } from 'react';
import { shareReport, type ShareReportInput } from '../../lib/share-report';

export function ShareReportButton({
  share,
  className = '',
  variant = 'primary',
}: {
  share: ShareReportInput;
  className?: string;
  variant?: 'primary' | 'secondary';
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleShare = async () => {
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const result = await shareReport(share);
      if (result === 'copied') {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : '分享失败');
    } finally {
      setBusy(false);
    }
  };

  const base =
    variant === 'primary'
      ? 'bg-primary text-textInv active:bg-primaryDk'
      : 'border border-primary/30 bg-primary/5 text-primary';

  return (
    <div className={className}>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleShare()}
        className={`min-h-12 w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50 ${base}`}
      >
        {busy ? '准备分享…' : copied ? '链接已复制' : '分享战报'}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
