import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createGame, fetchEvent } from '../api/events';
import type { EventDetail } from '../api/types';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { useT } from '../i18n';
import {
  canCreateGame,
  resolveOtherTeamId,
  teamOptionsForSide,
} from '../lib/new-game-teams';
import { useRequireAdmin } from '../lib/use-require-admin';

const DEFAULT_DURATION_MINUTES = 15;

export function NewGamePage() {
  const t = useT();
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
      setError(
        teams.length < 2 ? t('newGame.error.notEnoughTeams') : t('newGame.error.sameTeam'),
      );
      return;
    }
    if (durationMinutes < 1) {
      setError(t('newGame.error.minDuration'));
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
      setError(err instanceof Error ? err.message : t('newGame.error.create'));
    }
  };

  if (!token) {
    return (
      <PageShell title={t('newGame.title')} backTo={`/events/${shortCode}`}>
        <p className="text-sm text-textSec">{t('common.redirecting')}</p>
      </PageShell>
    );
  }

  return (
    <PageShell title={t('newGame.title')} backTo={`/events/${shortCode}`}>
      <Card>
        <label className="mb-2 block text-sm text-textSec">{t('newGame.teamA')}</label>
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
          {teamAOptions.map((tm) => (
            <option key={tm.id} value={tm.id}>
              {tm.name}
            </option>
          ))}
        </select>
        <label className="mb-2 block text-sm text-textSec">{t('newGame.teamB')}</label>
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
          {teamBOptions.map((tm) => (
            <option key={tm.id} value={tm.id}>
              {tm.name}
            </option>
          ))}
        </select>

        <div className="mb-3 flex w-full items-center rounded-xl border border-border bg-surface px-3 py-3">
          <label htmlFor="game-duration" className="shrink-0 text-sm text-textSec">
            {t('newGame.duration')}
          </label>
          <input
            id="game-duration"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            className="min-w-0 flex-1 bg-transparent px-2 py-0 text-right font-mono text-textPri outline-none"
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
          <p className="mb-2 text-sm text-textSec">{t('newGame.needTeams')}</p>
        )}
        {error && <p className="mb-2 text-sm text-danger">{error}</p>}
        <PrimaryButton disabled={!ready} onClick={() => void submit()}>
          {t('newGame.submit')}
        </PrimaryButton>
      </Card>
    </PageShell>
  );
}
