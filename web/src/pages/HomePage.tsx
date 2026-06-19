import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchEvent } from '../api/events';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { isEventEnded } from '../lib/event-status';
import { archiveEvent, removeRecentEvent } from '../lib/storage';
import { useSessionStore } from '../stores/session';

function EventListItem({ name, shortCode }: { name: string; shortCode: string }) {
  return (
    <Link
      to={`/events/${shortCode}`}
      className="flex items-center justify-between rounded-xl bg-chipBg px-3 py-3"
    >
      <span className="font-medium">{name}</span>
      <span className="font-mono text-xs text-textSec">{shortCode}</span>
    </Link>
  );
}

export function HomePage() {
  const recent = useSessionStore((s) => s.recentEvents);
  const archived = useSessionStore((s) => s.archivedEvents);
  const nav = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const sync = async () => {
      const { recentEvents, archivedEvents } = useSessionStore.getState();
      const all = [...recentEvents, ...archivedEvents];
      for (const e of all) {
        try {
          const data = await fetchEvent(e.shortCode);
          if (isEventEnded(data)) {
            archiveEvent(e.shortCode);
          }
        } catch {
          removeRecentEvent(e.shortCode);
        }
      }
    };
    void sync();
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
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-textSec">
          找回管理权限
        </h2>
        <p className="mb-3 text-xs text-textSec">
          换设备后输入分享码和 PIN，可重新获得录入与配置权限。
        </p>
        <Link
          to="/admin/restore"
          className="block rounded-xl bg-chipBg px-3 py-3 text-center text-sm font-semibold text-primary"
        >
          凭 PIN 恢复管理
        </Link>
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-textSec">
          进行中的活动
        </h2>
        <p className="mb-3 text-xs text-textSec">本机最近创建或访问的活动；手动「结束活动」后才会归档。</p>
        {recent.length === 0 ? (
          <p className="text-sm text-textSec">暂无进行中的活动，可新建或输入分享码加入。</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((e) => (
              <li key={e.shortCode}>
                <EventListItem name={e.name} shortCode={e.shortCode} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setShowArchived((v) => !v)}
          disabled={archived.length === 0}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-textSec">
            已归档{archived.length > 0 ? `（${archived.length}）` : ''}
          </h2>
          {archived.length > 0 && (
            <span className="text-xs text-primary">{showArchived ? '收起' : '展开'}</span>
          )}
        </button>
        {archived.length === 0 ? (
          <p className="mt-2 text-sm text-textSec">暂无已结束的活动。</p>
        ) : (
          showArchived && (
            <ul className="mt-3 space-y-2">
              {archived.map((e) => (
                <li key={e.shortCode}>
                  <EventListItem name={e.name} shortCode={e.shortCode} />
                </li>
              ))}
            </ul>
          )
        )}
      </Card>
    </PageShell>
  );
}
