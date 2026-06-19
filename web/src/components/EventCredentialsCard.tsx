import { useState } from 'react';
import { ShareNetwork } from '@phosphor-icons/react';
import { PagePanel, PagePanelBody, PagePanelHeader } from './ui/page-panel';
import { PrimaryButton } from './ui/layout';
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

export function EventCredentialsCard({ shortCode, pin, eventName, className }: Props) {
  const t = useT();
  const [shared, setShared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const shareText = buildCredentialsShareText({ shortCode, pin, eventName });

  const onShare = async () => {
    setBusy(true);
    setError('');
    setShared(false);
    try {
      await shareCredentialsText(shareText, t('cred.sectionTitle'), t);
      setShared(true);
      window.setTimeout(() => setShared(false), 2500);
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
          {shared ? t('cred.shared') : t('cred.share')}
        </PrimaryButton>

        {error && <p className="text-xs text-danger">{error}</p>}
      </PagePanelBody>
    </PagePanel>
  );
}
