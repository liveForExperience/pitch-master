import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchEvent, finishEvent as finishEventApi } from '../api/events';
import { ApiError } from '../api/client';
import type { EventDetail } from '../api/types';
import { EventCredentialsCard } from '../components/EventCredentialsCard';
import { EventSharePanel } from '../components/report/EventSharePanel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../components/ui/dialog';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { isEventEnded } from '../lib/event-status';
import {
  archiveEvent,
  findStoredEvent,
  getAdminToken,
  rememberEvent,
  removeRecentEvent,
} from '../lib/storage';
import { useSessionStore } from '../stores/session';

export function EventPage() {
  const { shortCode = '' } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
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
        if (isEventEnded(data)) {
          archiveEvent(data.shortCode);
        }
        const token = getAdminToken(data.id);
        if (token && !isEventEnded(data)) {
          const stored = findStoredEvent(data.shortCode);
          rememberEvent({
            id: data.id,
            shortCode: data.shortCode,
            name: data.name,
            pin: stored?.pin ?? '',
            createdAt: stored?.createdAt ?? data.createdAt,
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
  const storedPin = event ? findStoredEvent(event.shortCode)?.pin : undefined;
  const ended = event ? isEventEnded(event) : false;

  const confirmFinish = async () => {
    if (!event || !adminToken) return;
    setFinishing(true);
    setError('');
    try {
      await finishEventApi(event.id, adminToken);
      archiveEvent(event.shortCode);
      const data = await fetchEvent(event.shortCode);
      setEvent(data);
      setFinishOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '结束活动失败');
    } finally {
      setFinishing(false);
    }
  };

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
                你通过分享码进入，只能查看比分与比赛进度。新建比赛、配置队员需管理员权限；若你是管理员，可
                <Link to={`/admin/restore?code=${event.shortCode}`} className="text-primary">
                  凭 PIN 找回
                </Link>
                。
              </p>
            </Card>
          )}

          {!isAdmin && (
            <Card>
              <p className="text-sm text-textSec">分享码</p>
              <p className="font-mono text-2xl font-bold text-primary">{event.shortCode}</p>
            </Card>
          )}

          {isAdmin && storedPin && (
            <EventCredentialsCard
              shortCode={event.shortCode}
              pin={storedPin}
              hint="把分享码发给其他人只读观看；PIN 仅保存在本机，换设备需用截图或首页「找回管理权限」。"
            />
          )}

          {isAdmin && !storedPin && (
            <Card>
              <p className="text-sm text-textSec">分享码</p>
              <p className="font-mono text-2xl font-bold text-primary">{event.shortCode}</p>
              <p className="mt-2 text-xs text-textSec">
                本机未保存 PIN，换设备后请用创建活动时的截图找回管理权限。
              </p>
            </Card>
          )}

          {event.games.length > 0 && (
            <EventSharePanel eventName={event.name} shortCode={event.shortCode} />
          )}

          <section className="border-t border-border pt-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-body font-bold text-textPri">比赛列表</p>
              <div className="flex items-center gap-3">
                {event.games.length > 0 && (
                  <Link
                    to={`/events/${event.shortCode}/report`}
                    className="text-sm text-primary"
                  >
                    分享战报
                  </Link>
                )}
                {isAdmin && !ended && (
                  <Link
                    to={`/games/new?eventId=${event.id}&shortCode=${event.shortCode}`}
                    className="text-sm font-semibold text-primary"
                  >
                    新建场次
                  </Link>
                )}
              </div>
            </div>
            {event.games.length === 0 ? (
              <p className="text-sm text-textSec">
                {isAdmin ? '还没有比赛，点右上角新建场次。' : '还没有比赛。'}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {event.games.map((g) => {
                  const a = event.teams.find((t) => t.id === g.teamAId)?.name ?? 'A';
                  const b = event.teams.find((t) => t.id === g.teamBId)?.name ?? 'B';
                  return (
                    <li key={g.id}>
                      <Link
                        to={isAdmin ? `/games/${g.id}/record` : `/games/${g.id}`}
                        className="block py-3 active:bg-elevated"
                      >
                        <div className="font-medium text-textPri">
                          {a} vs {b}
                        </div>
                        <div className="mt-0.5 text-xs text-textSec">
                          {g.status}
                          {isAdmin ? ' · 管理' : ' · 只读观看'}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {isAdmin && !ended ? (
            <>
              <PrimaryButton>
                <Link to={`/events/${shortCode}/setup`} className="block w-full">
                  配置队伍与队员
                </Link>
              </PrimaryButton>
              <button
                type="button"
                onClick={() => setFinishOpen(true)}
                className="min-h-12 w-full rounded-2xl border border-danger/30 px-4 py-3 text-sm font-semibold text-danger"
              >
                结束活动
              </button>
            </>
          ) : isAdmin ? null : (
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

          <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
            <DialogContent>
              <DialogTitle>结束这场活动？</DialogTitle>
              <DialogDescription>
                结束后活动会移入首页「已归档」，仍可查看历史比分，但不能再新建比赛或录入。
              </DialogDescription>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setFinishOpen(false)}
                  className="min-h-12 flex-1 rounded-xl border border-border px-3 text-sm font-semibold text-textSec"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={finishing}
                  onClick={() => void confirmFinish()}
                  className="min-h-12 flex-1 rounded-xl bg-danger px-3 text-sm font-semibold text-textInv disabled:opacity-50"
                >
                  {finishing ? '处理中…' : '确认结束'}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </PageShell>
  );
}
