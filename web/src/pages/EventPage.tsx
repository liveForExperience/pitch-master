import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchEvent } from '../api/events';
import type { EventDetail } from '../api/types';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { getAdminToken, rememberEvent } from '../lib/storage';

export function EventPage() {
  const { shortCode = '' } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvent(shortCode)
      .then((data) => {
        setEvent(data);
        const pin = getRecentPin(shortCode);
        rememberEvent({ id: data.id, shortCode: data.shortCode, name: data.name, pin: pin ?? '------' });
      })
      .catch((err: Error) => setError(err.message));
  }, [shortCode]);

  const adminToken = event ? getAdminToken(event.id) : null;

  return (
    <PageShell title={event?.name ?? '活动'} backTo="/">
      {error && <p className="text-sm text-danger">{error}</p>}
      {event && (
        <>
          <Card>
            <p className="text-sm text-textSec">分享码</p>
            <p className="font-mono text-2xl font-bold text-primary">{event.shortCode}</p>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">比赛列表</h2>
              <Link
                to={`/games/new?eventId=${event.id}&shortCode=${event.shortCode}`}
                className="text-sm text-primary"
              >
                + 新建
              </Link>
            </div>
            {event.games.length === 0 ? (
              <p className="text-sm text-textSec">还没有比赛</p>
            ) : (
              <ul className="space-y-2">
                {event.games.map((g) => {
                  const a = event.teams.find((t) => t.id === g.teamAId)?.name ?? 'A';
                  const b = event.teams.find((t) => t.id === g.teamBId)?.name ?? 'B';
                  return (
                    <li key={g.id}>
                      <Link
                        to={adminToken ? `/games/${g.id}/record` : `/games/${g.id}`}
                        className="block rounded-xl bg-chipBg px-3 py-3"
                      >
                        <div className="font-medium">
                          {a} vs {b}
                        </div>
                        <div className="text-xs text-textSec">{g.status}</div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <PrimaryButton>
            <Link to={`/events/${shortCode}/setup`} className="block w-full">
              配置队伍与队员
            </Link>
          </PrimaryButton>
        </>
      )}
    </PageShell>
  );
}

function getRecentPin(shortCode: string): string | null {
  const list = JSON.parse(localStorage.getItem('pitchmaster.recentEvents') ?? '[]') as Array<{
    shortCode: string;
    pin: string;
  }>;
  return list.find((e) => e.shortCode === shortCode)?.pin ?? null;
}
