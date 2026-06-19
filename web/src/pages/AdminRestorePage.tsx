import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { fetchEvent, restoreAdminToken } from '../api/events';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { useT } from '../i18n';
import { rememberEvent, setAdminToken } from '../lib/storage';

export function AdminRestorePage() {
  const t = useT();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [shortCode, setShortCode] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [restoredEvent, setRestoredEvent] = useState<{ id: string; shortCode: string; name: string } | null>(
    null,
  );

  const prefilledCode = searchParams.get('code')?.trim().toUpperCase() ?? '';
  const backTo = prefilledCode ? `/events/${prefilledCode}` : '/';

  useEffect(() => {
    if (prefilledCode) {
      setShortCode(prefilledCode);
      document.getElementById('restore-pin')?.focus();
    }
  }, [prefilledCode]);

  const submit = async () => {
    const code = shortCode.trim().toUpperCase();
    const pinValue = pin.trim();
    if (code.length < 4 || pinValue.length !== 6) {
      setError(t('restore.error.format'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const event = await fetchEvent(code);
      const result = await restoreAdminToken(event.id, pinValue);
      if (!result.restored || !result.adminToken) {
        setError(t('restore.error.wrongPin'));
        return;
      }

      setAdminToken(event.id, result.adminToken);
      rememberEvent({
        id: event.id,
        shortCode: event.shortCode,
        name: event.name,
        pin: pinValue,
        createdAt: event.createdAt,
      });
      setRestoredEvent({ id: event.id, shortCode: event.shortCode, name: event.name });
      setSuccessOpen(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('restore.error.retry'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title={t('restore.title')} backTo={backTo}>
      <Card>
        <p className="mb-4 text-sm text-textSec">
          {t('restore.hintBase')} <strong>PIN</strong>
          {prefilledCode ? t('restore.hintWithPrefill') : t('restore.hintNoPrefill')}
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="restore-short-code" className="mb-2 block">
              {t('restore.label.shortCode')}
            </Label>
            <input
              id="restore-short-code"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={6}
              placeholder={t('restore.shortCodePlaceholder')}
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value.toUpperCase())}
              readOnly={Boolean(prefilledCode)}
              className="field-select"
            />
          </div>

          <div>
            <Label htmlFor="restore-pin" className="mb-2 block">
              {t('restore.label.pin')}
            </Label>
            <input
              id="restore-pin"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder={t('restore.pinPlaceholder')}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="field-select font-mono tracking-widest"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-4">
          <PrimaryButton disabled={loading} onClick={() => void submit()}>
            {loading ? t('restore.verifying') : t('restore.submit')}
          </PrimaryButton>
        </div>
      </Card>

      <p className="text-center text-xs text-textSec">
        {t('restore.viewerHint')}{' '}
        <Link to="/" className="text-primary">
          {t('restore.viewerLink')}
        </Link>
      </p>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogTitle>{t('restore.success.title')}</DialogTitle>
          <DialogDescription>
            {restoredEvent
              ? t('restore.success.desc', { name: restoredEvent.name })
              : t('restore.success.descFallback')}
          </DialogDescription>
          <PrimaryButton
            className="mt-4"
            onClick={() => {
              if (restoredEvent) nav(`/events/${restoredEvent.shortCode}`);
              else nav('/');
            }}
          >
            {t('restore.success.enter')}
          </PrimaryButton>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
