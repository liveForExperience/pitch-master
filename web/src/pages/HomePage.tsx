import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchEvent } from '../api/events';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { removeRecentEvent } from '../lib/storage';
import { useSessionStore } from '../stores/session';

export function HomePage() {
  const recent = useSessionStore((s) => s.recentEvents);
  const nav = useNavigate();
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    const list = useSessionStore.getState().recentEvents;
    for (const e of list) {
      fetchEvent(e.shortCode).catch(() => removeRecentEvent(e.shortCode));
    }
  }, []);

  const goJoin = () => {
    const code = joinCode.trim().toUpperCase().replace(/\s/g, '');
    if (code.length < 4) return;
    nav(`/events/${code}`);
  };

  return (
    <PageShell title="PitchMaster">
      <PrimaryButton>
        <Link to="/events/new" className="block w-full">
          + 新建活动
        </Link>
      </PrimaryButton>

      <Card>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-textSec">
          加入活动（只读观看）
        </h2>
        <p className="mb-3 text-xs text-textSec">
          在另一台设备上输入管理员分享的 6 位分享码，即可查看比分与比赛进度。
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="例如 A4F9KQ"
            maxLength={6}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && goJoin()}
            className="min-h-14 flex-1 rounded-xl border border-border px-3 font-mono text-lg tracking-widest"
          />
          <button
            type="button"
            onClick={goJoin}
            disabled={joinCode.trim().length < 4}
            className="min-h-14 rounded-xl bg-primary px-4 text-sm font-semibold text-textInv disabled:opacity-40"
          >
            进入
          </button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-textSec">最近活动</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-textSec">本机创建过的活动会出现在这里。</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((e) => (
              <li key={e.shortCode}>
                <Link
                  to={`/events/${e.shortCode}`}
                  className="flex items-center justify-between rounded-xl bg-chipBg px-3 py-3"
                >
                  <span className="font-medium">{e.name}</span>
                  <span className="font-mono text-xs text-textSec">{e.shortCode}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageShell>
  );
}
