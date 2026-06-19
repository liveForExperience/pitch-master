import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createGame, fetchEvent } from '../api/events';
import type { EventDetail } from '../api/types';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import {
  canCreateGame,
  resolveOtherTeamId,
  teamOptionsForSide,
} from '../lib/new-game-teams';
import { useRequireAdmin } from '../lib/use-require-admin';

const DEFAULT_DURATION_MINUTES = 15;

export function NewGamePage() {
  const [params] = useSearchParams();
  const eventId = params.get('eventId') ?? '';
  const shortCode = params.get('shortCode') ?? '';
  const nav = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION_MINUTES);
  const [customMinutes, setCustomMinutes] = useState(String(DEFAULT_DURATION_MINUTES));
  const [error, setError] = useState('');

  const token = useRequireAdmin(eventId || undefined, `/events/${shortCode}`);
  const teams = event?.teams ?? [];
  const teamAOptions = teamOptionsForSide(teams, teamBId);
  const teamBOptions = teamOptionsForSide(teams, teamAId);
  const ready = canCreateGame(teamAId, teamBId, teams.length);

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
    if (!token || !ready) {
      setError(teams.length < 2 ? '至少需要两支队伍才能开赛' : '请选择两个不同的队伍');
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
          onChange={(e) => {
            const next = e.target.value;
            setTeamAId(next);
            setTeamBId((prev) => resolveOtherTeamId(teams, next, prev));
            setError('');
          }}
        >
          {teamAOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <label className="mb-2 block text-sm text-textSec">客队 (B)</label>
        <select
          className="field-select mb-3"
          value={teamBId}
          onChange={(e) => {
            const next = e.target.value;
            setTeamBId(next);
            setTeamAId((prev) => resolveOtherTeamId(teams, next, prev));
            setError('');
          }}
        >
          {teamBOptions.map((t) => (
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

        {teams.length < 2 && (
          <p className="mb-2 text-sm text-textSec">请先在活动里配置至少两支队伍。</p>
        )}
        {error && <p className="mb-2 text-sm text-danger">{error}</p>}
        <PrimaryButton disabled={!ready} onClick={() => void submit()}>
          创建比赛
        </PrimaryButton>
      </Card>
    </PageShell>
  );
}
