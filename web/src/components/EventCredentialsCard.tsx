import { Card } from './ui/layout';
import { useT } from '../i18n';

type Props = {
  shortCode: string;
  pin: string;
  hint?: string;
};

export function EventCredentialsCard({ shortCode, pin, hint }: Props) {
  const t = useT();
  return (
    <Card className="border-primary/30 bg-primary/5">
      <p className="text-sm font-semibold text-textPri">{t('cred.savePrompt')}</p>
      <p className="mt-1 text-xs text-textSec">{hint ?? t('cred.defaultHint')}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface px-3 py-3">
          <p className="text-xs text-textSec">{t('cred.shareCode')}</p>
          <p className="font-mono text-xl font-bold tracking-widest text-primary">{shortCode}</p>
        </div>
        <div className="rounded-xl bg-surface px-3 py-3">
          <p className="text-xs text-textSec">{t('cred.pin')}</p>
          <p className="font-mono text-xl font-bold tracking-widest text-textPri">{pin}</p>
        </div>
      </div>
    </Card>
  );
}
