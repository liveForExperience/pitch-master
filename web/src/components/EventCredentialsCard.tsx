import { Card } from './ui/layout';

type Props = {
  shortCode: string;
  pin: string;
  hint?: string;
};

export function EventCredentialsCard({ shortCode, pin, hint }: Props) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <p className="text-sm font-semibold text-textPri">请截图保存一下凭证</p>
      <p className="mt-1 text-xs text-textSec">
        {hint ?? '换手机后需用分享码 + PIN 找回管理权限；分享码也可发给其他人只读观看。'}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface px-3 py-3">
          <p className="text-xs text-textSec">分享码</p>
          <p className="font-mono text-xl font-bold tracking-widest text-primary">{shortCode}</p>
        </div>
        <div className="rounded-xl bg-surface px-3 py-3">
          <p className="text-xs text-textSec">6 位 PIN</p>
          <p className="font-mono text-xl font-bold tracking-widest text-textPri">{pin}</p>
        </div>
      </div>
    </Card>
  );
}
