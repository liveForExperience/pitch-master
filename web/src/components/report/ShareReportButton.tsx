import { useState } from 'react';
import { ShareNetwork } from '@phosphor-icons/react';
import { shareReport, type ShareReportInput } from '../../lib/share-report';
import { useT } from '../../i18n';
import { reportActionTileClass, reportActionIconClass } from './report-action-styles';

export function ShareReportButton({
  share,
  className = '',
  variant = 'primary',
  layout = 'bar',
  label,
}: {
  share: ShareReportInput;
  className?: string;
  variant?: 'primary' | 'secondary';
  layout?: 'bar' | 'tile';
  label?: string;
}) {
  const t = useT();
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
      setError(err instanceof Error ? err.message : t('common.error.share'));
    } finally {
      setBusy(false);
    }
  };

  const base =
    layout === 'tile'
      ? reportActionTileClass
      : variant === 'primary'
        ? 'bg-primary text-textInv active:bg-primaryDk'
        : 'border border-primary/30 bg-primary/5 text-primary';

  const text = busy ? t('share.preparing') : copied ? t('share.copied') : label ?? t('share.label');

  return (
    <div className={className}>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleShare()}
        className={`w-full disabled:opacity-50 ${
          layout === 'tile'
            ? base
            : `min-h-12 rounded-xl px-4 py-3 text-sm font-semibold ${base}`
        }`}
      >
        {layout === 'tile' ? (
          <>
            <ShareNetwork size={22} weight="bold" className={reportActionIconClass} aria-hidden />
            <span>{text}</span>
          </>
        ) : (
          text
        )}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
