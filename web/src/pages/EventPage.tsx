import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchEvent } from '../api/events';
import { ApiError } from '../api/client';
import type { EventDetail } from '../api/types';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { getAdminToken, getRecentEvents, rememberEvent, removeRecentEvent } from '../lib/storage';
import { useSessionStore } from '../stores/session';

export function EventPage() {
  const { shortCode = '' } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const adminTokens = useSessionStore((s) => s.adminTokens);

  useEffect(() => {
    const code = shortCode.trim().toUpperCase();
    if (!code) return;
    setError('');
    setNotFound(false);
    setEvent(null);
    fetchEvent(code)
      .then((data) => {
        setEvent(data);
        const token = getAdminToken(data.id);
        if (token) {
          const pin = getRecentEvents().find((e) => e.shortCode === data.shortCode)?.pin;
          rememberEvent({
            id: data.id,
            shortCode: data.shortCode,
            name: data.name,
            pin: pin ?? '------',
          });
        }
      })
      .catch((err: Error) => {
        if (err instanceof ApiError && err.code === 'not_found') {
          removeRecentEvent(code);
          setNotFound(true);
          return;
        }
        setError(err.message);
      });
  }, [shortCode, adminTokens]);

  const adminToken = event ? getAdminToken(event.id) : null;
  const isAdmin = Boolean(adminToken);

  if (notFound) {
    return (
      <PageShell title="找不到活动" backTo="/">
        <Card>
          <p className="text-sm text-textPri">
            分享码{' '}
            <span className="font-mono font-semibold">{shortCode.toUpperCase()}</span>{' '}
            打不开这场活动。
          </p>
          <p className="mt-2 text-xs text-textSec">
            请核对是否输错；若活动已结束较久或换过手机，也可能需要重新创建。
          </p>
          <div className="mt-4 space-y-2">
            <PrimaryButton>
              <Link to="/events/new" className="block w-full">
                新建活动
              </Link>
            </PrimaryButton>
            <Link to="/" className="block text-center text-sm text-primary">
              返回首页
            </Link>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell title={event?.name ?? '活动'} backTo="/">
      {error && <p className="text-sm text-danger">{error}</p>}
      {!event && !error && <p className="text-sm text-textSec">加载中…</p>}
      {event && (
        <>
          {!isAdmin && (
            <Card className="border-primary/30 bg-primary/5">
              <p className="text-sm font-medium text-textPri">只读观看模式</p>
              <p className="mt-1 text-xs text-textSec">
                你通过分享码进入，只能查看比分与比赛进度。新建比赛、配置队员需管理员在本机创建活动，或通过 PIN 找回管理权限。
              </p>
            </Card>
          )}

          <Card>
            <p className="text-sm text-textSec">分享码</p>
            <p className="font-mono text-2xl font-bold text-primary">{event.shortCode}</p>
            {isAdmin && (
              <p className="mt-2 text-xs text-textSec">
                把分享码发给其他人，他们可在首页「加入活动」只读观看。
              </p>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">比赛列表</h2>
              {isAdmin && (
                <Link
                  to={`/games/new?eventId=${event.id}&shortCode=${event.shortCode}`}
                  className="text-sm text-primary"
                >
                  + 新建
                </Link>
              )}
            </div>
            {event.games.length === 0 ? (
              <p className="text-sm text-textSec">
                {isAdmin ? '还没有比赛，点右上角新建。' : '还没有比赛。'}
              </p>
            ) : (
              <ul className="space-y-2">
                {event.games.map((g) => {
                  const a = event.teams.find((t) => t.id === g.teamAId)?.name ?? 'A';
                  const b = event.teams.find((t) => t.id === g.teamBId)?.name ?? 'B';
                  return (
                    <li key={g.id}>
                      <Link
                        to={isAdmin ? `/games/${g.id}/record` : `/games/${g.id}`}
                        className="block rounded-xl bg-chipBg px-3 py-3"
                      >
                        <div className="font-medium">
                          {a} vs {b}
                        </div>
                        <div className="text-xs text-textSec">
                          {g.status}
                          {isAdmin ? ' · 管理' : ' · 只读观看'}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {isAdmin ? (
            <PrimaryButton>
              <Link to={`/events/${shortCode}/setup`} className="block w-full">
                配置队伍与队员
              </Link>
            </PrimaryButton>
          ) : (
            <Card>
              <h2 className="mb-2 font-semibold">参赛队伍</h2>
              {event.teams.length === 0 ? (
                <p className="text-sm text-textSec">尚未配置队伍</p>
              ) : (
                <ul className="space-y-3">
                  {event.teams.map((team) => (
                    <li key={team.id}>
                      <div className="mb-1 flex items-center gap-2 font-medium">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ background: team.colorHex }}
                        />
                        {team.name}
                      </div>
                      <p className="text-sm text-textSec">
                        {team.roster.length > 0
                          ? team.roster.map((p) => p.name).join('、')
                          : '暂无队员'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </>
      )}
    </PageShell>
  );
}
