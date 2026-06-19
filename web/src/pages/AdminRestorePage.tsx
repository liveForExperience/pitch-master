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
import { rememberEvent, setAdminToken } from '../lib/storage';

export function AdminRestorePage() {
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
      setError('请输入分享码和 6 位 PIN');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const event = await fetchEvent(code);
      const result = await restoreAdminToken(event.id, pinValue);
      if (!result.restored || !result.adminToken) {
        setError('未能恢复管理权限，请确认 PIN 是否正确');
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
      setError(err instanceof ApiError ? err.message : '恢复失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="找回管理权限" backTo={backTo}>
      <Card>
        <p className="mb-4 text-sm text-textSec">
          换手机或清过浏览器数据后，用创建活动时保存的 <strong>PIN</strong>
          {prefilledCode ? ' 即可重新获得录入权限（分享码已自动填入）。' : ' 与分享码可重新获得录入权限。'}
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="restore-short-code" className="mb-2 block">
              分享码
            </Label>
            <input
              id="restore-short-code"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={6}
              placeholder="例如 A4F9KQ"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value.toUpperCase())}
              readOnly={Boolean(prefilledCode)}
              className="field-select"
            />
          </div>

          <div>
            <Label htmlFor="restore-pin" className="mb-2 block">
              6 位 PIN
            </Label>
            <input
              id="restore-pin"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="创建活动时显示的 PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="field-select font-mono tracking-widest"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-4">
          <PrimaryButton disabled={loading} onClick={() => void submit()}>
            {loading ? '验证中…' : '恢复管理权限'}
          </PrimaryButton>
        </div>
      </Card>

      <p className="text-center text-xs text-textSec">
        只有观看、不需要录入？{' '}
        <Link to="/" className="text-primary">
          返回首页加入活动
        </Link>
      </p>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogTitle>已恢复管理权限</DialogTitle>
          <DialogDescription>
            {restoredEvent
              ? `「${restoredEvent.name}」已可在本机录入比分与配置队员。`
              : '本机已重新获得管理权限。'}
          </DialogDescription>
          <PrimaryButton
            className="mt-4"
            onClick={() => {
              if (restoredEvent) nav(`/events/${restoredEvent.shortCode}`);
              else nav('/');
            }}
          >
            进入活动
          </PrimaryButton>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
