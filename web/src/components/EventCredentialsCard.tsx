import { useEffect, useRef, useState } from 'react';
import { ShareNetwork } from '@phosphor-icons/react';
import { PagePanel, PagePanelBody, PagePanelHeader } from './ui/page-panel';
import { PrimaryButton } from './ui/layout';
import { InlineAlert } from './ui/inline-alert';
import { useT } from '../i18n';
import {
  buildCredentialsShareText,
  shareCredentialsText,
} from '../lib/credentials-share';

type Props = {
  shortCode: string;
  pin: string;
  eventName?: string;
  className?: string;
};

type ShareOutcome = 'idle' | 'copied' | 'shared';

export function EventCredentialsCard({ shortCode, pin, eventName, className }: Props) {
  const t = useT();
  const [outcome, setOutcome] = useState<ShareOutcome>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const hideTimer = useRef<number | null>(null);

  const shareText = buildCredentialsShareText({ shortCode, pin, eventName });

  useEffect(
    () => () => {
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    },
    [],
  );

  const onShare = async () => {
    setBusy(true);
    setError('');
    setOutcome('idle');
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    try {
      const result = await shareCredentialsText(shareText, t('cred.sectionTitle'), t);
      setOutcome(result);
      // Keep the success + warning visible long enough to read (warning is the
      // important bit) but auto-clear so the card returns to its quiet state.
      hideTimer.current = window.setTimeout(() => {
        setOutcome('idle');
        hideTimer.current = null;
      }, 8000);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : t('common.error.share'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PagePanel className={className}>
      <PagePanelHeader title={t('cred.sectionTitle')} />
      <PagePanelBody className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border px-3 py-3">
            <p className="text-xs text-textSec">{t('cred.shareCode')}</p>
            <p className="mt-1 font-mono text-lg font-bold tracking-widest text-textPri">
              {shortCode.trim().toUpperCase()}
            </p>
          </div>
          <div className="rounded-xl border border-border px-3 py-3">
            <p className="text-xs text-textSec">{t('cred.pin')}</p>
            <p className="mt-1 font-mono text-lg font-bold tracking-widest text-textPri">{pin}</p>
          </div>
        </div>

        <PrimaryButton
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold"
          disabled={busy}
          onClick={() => void onShare()}
        >
          <ShareNetwork size={20} weight="bold" aria-hidden />
          {outcome !== 'idle' ? t('cred.shared') : t('cred.share')}
        </PrimaryButton>

        {outcome !== 'idle' && (
          <div className="space-y-2" role="status" aria-live="polite">
            <InlineAlert tone="info">
              {outcome === 'copied'
                ? t('cred.shareSuccess.copied')
                : t('cred.shareSuccess.shared')}
            </InlineAlert>
            <InlineAlert tone="warning">{t('cred.shareWarning')}</InlineAlert>
          </div>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}
      </PagePanelBody>
    </PagePanel>
  );
}
