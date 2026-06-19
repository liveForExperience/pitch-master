import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createGame, fetchEvent } from '../api/events';
import type { EventDetail } from '../api/types';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { useRequireAdmin } from '../lib/use-require-admin';

export function NewGamePage() {
  const [params] = useSearchParams();
  const eventId = params.get('eventId') ?? '';
  const shortCode = params.get('shortCode') ?? '';
  const nav = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [customMinutes, setCustomMinutes] = useState('30');
  const [error, setError] = useState('');

  const token = useRequireAdmin(eventId || undefined, `/events/${shortCode}`);

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

  const applyCustomMinutes = (raw: string) => {
    setCustomMinutes(raw);
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 1) setDurationMinutes(n);
  };

  const submit = async () => {
    if (!token || !teamAId || !teamBId || teamAId === teamBId) {
      setError('请选择两个不同的队伍');
      return;
    }
    if (durationMinutes < 1) {
      setError('比赛时长至少 1 分钟');
      return;
    }
    try {
      const game = await createGame(
        eventId,
        teamAId,
        teamBId,
        token,
        durationMinutes * 60 * 1000,
      );
      nav(`/games/${game.id}/record`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    }
  };

  if (!token) {
    return (
      <PageShell title="新建场次" backTo={`/events/${shortCode}`}>
        <p className="text-sm text-textSec">正在跳转…</p>
      </PageShell>
    );
  }

  return (
    <PageShell title="新建场次" backTo={`/events/${shortCode}`}>
      <Card>
        <label className="mb-2 block text-sm text-textSec">主队 (A)</label>
        <select
          className="field-select mb-3"
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
          className="field-select mb-3"
          value={teamBId}
          onChange={(e) => setTeamBId(e.target.value)}
        >
          {event?.teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <div className="mb-3 flex w-full items-center rounded-xl border border-border px-3 py-3">
          <label htmlFor="game-duration" className="shrink-0 text-sm text-textSec">
            比赛时长（分钟）
          </label>
          <input
            id="game-duration"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            className="min-w-0 flex-1 bg-transparent px-2 py-0 text-right font-mono outline-none"
            value={customMinutes}
            onChange={(e) => applyCustomMinutes(e.target.value)}
            onBlur={() => {
              const n = parseInt(customMinutes, 10);
              if (!Number.isFinite(n) || n < 1) {
                setCustomMinutes('1');
                setDurationMinutes(1);
              } else {
                setCustomMinutes(String(n));
                setDurationMinutes(n);
              }
            }}
          />
        </div>

        {error && <p className="mb-2 text-sm text-danger">{error}</p>}
        <PrimaryButton onClick={() => void submit()}>创建比赛</PrimaryButton>
      </Card>
    </PageShell>
  );
}
