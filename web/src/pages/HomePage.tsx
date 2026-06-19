import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchEvent } from '../api/events';
import { PageShell } from '../components/ui/layout';
import { isEventEnded } from '../lib/event-status';
import { archiveEvent, removeRecentEvent } from '../lib/storage';
import { useSessionStore } from '../stores/session';

function EventListItem({ name, shortCode }: { name: string; shortCode: string }) {
  return (
    <Link
      to={`/events/${shortCode}`}
      className="flex items-center justify-between py-3 active:bg-elevated"
    >
      <span className="font-medium text-textPri">{name}</span>
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
      <Link
        to="/events/new"
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-semibold text-textInv active:bg-primaryDk"
      >
        新建活动
      </Link>

      <div className="divide-y divide-border border-y border-border">
        <section className="py-6">
          <p className="text-body font-bold text-textPri">加入活动</p>
          <p className="mt-1 text-caption text-textSec">
            输入管理员分享的 6 位分享码，只读观看比分与比赛进度。
          </p>
          <div className="mt-4 flex gap-2">
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
        </section>

        <section className="py-6">
          <p className="text-body font-bold text-textPri">找回管理权限</p>
          <p className="mt-1 text-caption text-textSec">
            换设备后输入分享码和 PIN，可重新获得录入与配置权限。
          </p>
          <Link
            to="/admin/restore"
            className="mt-4 block border border-border py-3 text-center text-sm font-semibold text-primary active:bg-elevated"
          >
            凭 PIN 恢复管理
          </Link>
        </section>

        <section className="py-6">
          <p className="text-body font-bold text-textPri">进行中的活动</p>
          <p className="mt-1 text-caption text-textSec">
            本机最近创建或访问的活动；手动「结束活动」后才会归档。
          </p>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-textSec">暂无进行中的活动，可新建或输入分享码加入。</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {recent.map((e) => (
                <li key={e.shortCode}>
                  <EventListItem name={e.name} shortCode={e.shortCode} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="py-6">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setShowArchived((v) => !v)}
            disabled={archived.length === 0}
          >
            <div>
              <p className="text-body font-bold text-textPri">
                已归档{archived.length > 0 ? ` · ${archived.length}` : ''}
              </p>
              <p className="mt-1 text-caption text-textSec">已结束的活动记录</p>
            </div>
            {archived.length > 0 && (
              <span className="text-xs text-primary">{showArchived ? '收起' : '展开'}</span>
            )}
          </button>
          {archived.length === 0 ? (
            <p className="mt-4 text-sm text-textSec">暂无已结束的活动。</p>
          ) : (
            showArchived && (
              <ul className="mt-2 divide-y divide-border">
                {archived.map((e) => (
                  <li key={e.shortCode}>
                    <EventListItem name={e.name} shortCode={e.shortCode} />
                  </li>
                ))}
              </ul>
            )
          )}
        </section>
      </div>
    </PageShell>
  );
}
