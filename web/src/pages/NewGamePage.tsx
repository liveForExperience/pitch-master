import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createGame, fetchEvent } from '../api/events';
import type { EventDetail } from '../api/types';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { getAdminToken } from '../lib/storage';

export function NewGamePage() {
  const [params] = useSearchParams();
  const eventId = params.get('eventId') ?? '';
  const shortCode = params.get('shortCode') ?? '';
  const nav = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shortCode) return;
    fetchEvent(shortCode)
      .then((e) => {
        setEvent(e);
        if (e.teams.length >= 2) {
          setTeamAId(e.teams[0]!.id);
          setTeamBId(e.teams[1]!.id);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, [shortCode]);

  const submit = async () => {
    const token = getAdminToken(eventId);
    if (!token || !teamAId || !teamBId) return;
    try {
      const game = await createGame(eventId, teamAId, teamBId, token);
      nav(`/games/${game.id}/record`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    }
  };

  return (
    <PageShell title="新建比赛" backTo={`/events/${shortCode}`}>
      <Card>
        <label className="mb-2 block text-sm text-textSec">主队 (A)</label>
        <select
          className="mb-3 w-full rounded-xl border border-border px-3 py-3"
          value={teamAId}
          onChange={(e) => setTeamAId(e.target.value)}
        >
          {event?.teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <label className="mb-2 block text-sm text-textSec">客队 (B)</label>
        <select
          className="mb-3 w-full rounded-xl border border-border px-3 py-3"
          value={teamBId}
          onChange={(e) => setTeamBId(e.target.value)}
        >
          {event?.teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {error && <p className="mb-2 text-sm text-danger">{error}</p>}
        <PrimaryButton onClick={() => void submit()}>创建并开始</PrimaryButton>
      </Card>
    </PageShell>
  );
}
