import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchEvent } from '../api/events';
import type { EventDetail } from '../api/types';
import { RosterImportPanel } from '../components/roster/RosterImportPanel';
import { TeamImportChips } from '../components/roster/TeamImportChips';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import {
  clearRosterImportPool,
  loadRosterImportPool,
  saveRosterImportPool,
} from '../lib/roster-import-store';
import { useRequireAdmin } from '../lib/use-require-admin';

export function EventSetupPage() {
  const { shortCode = '' } = useParams();
  const nav = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [newTeam, setNewTeam] = useState('');
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [importPool, setImportPool] = useState<string[]>([]);
  const [error, setError] = useState('');

  const reload = () =>
    fetchEvent(shortCode)
      .then(setEvent)
      .catch((err: Error) => setError(err.message));

  useEffect(() => {
    void reload();
  }, [shortCode]);

  const token = useRequireAdmin(event?.id, `/events/${shortCode}`);

  useEffect(() => {
    if (!event?.id) return;
    if (event.status === 'FINISHED') {
      clearRosterImportPool(event.id);
      setImportPool([]);
      return;
    }
    setImportPool(loadRosterImportPool(event.id));
  }, [event?.id, event?.status]);

  const updateImportPool = useCallback(
    (names: string[]) => {
      setImportPool(names);
      if (event?.id) saveRosterImportPool(event.id, names);
    },
    [event?.id],
  );

  if (!token) {
    return (
      <PageShell title="队伍配置" backTo={`/events/${shortCode}`}>
        <p className="text-sm text-textSec">正在跳转…</p>
      </PageShell>
    );
  }

  const addTeam = async () => {
    if (!event || !newTeam.trim()) return;
    const { createTeam } = await import('../api/events');
    await createTeam(event.id, newTeam.trim(), token);
    setNewTeam('');
    await reload();
  };

  const addPlayers = async (teamId: string) => {
    const raw = draftNames[teamId] ?? '';
    const names = raw.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    const { addRoster } = await import('../api/events');
    await addRoster(teamId, names, token);
    setDraftNames((d) => ({ ...d, [teamId]: '' }));
    await reload();
  };

  const addFromImport = async (teamId: string, names: string[]) => {
    const { addRoster } = await import('../api/events');
    await addRoster(teamId, names, token);
    setImportPool((prev) => {
      const next = prev.filter((n) => !names.includes(n));
      if (event?.id) saveRosterImportPool(event.id, next);
      return next;
    });
    await reload();
  };

  return (
    <PageShell title="队伍配置" backTo={`/events/${shortCode}`}>
      {error && <p className="text-sm text-danger">{error}</p>}

      <RosterImportPanel pool={importPool} onPoolChange={updateImportPool} />

      <Card>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-border px-3 py-3"
            placeholder="新队伍名称"
            value={newTeam}
            onChange={(e) => setNewTeam(e.target.value)}
          />
          <button
            type="button"
            className="rounded-xl bg-primary px-4 font-semibold text-textInv"
            onClick={() => void addTeam()}
          >
            添加
          </button>
        </div>
      </Card>

      {event?.teams.map((team) => (
        <Card key={team.id}>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: team.colorHex }} />
            <h3 className="font-semibold">{team.name}</h3>
          </div>
          <ul className="mb-3 space-y-1 text-sm">
            {team.roster.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>

          <TeamImportChips
            teamName={team.name}
            pool={importPool}
            rosterNames={team.roster.map((p) => p.name)}
            onAdd={(names) => addFromImport(team.id, names)}
          />

          <textarea
            className="mb-2 w-full rounded-xl border border-border px-3 py-2 text-sm"
            rows={2}
            placeholder="输入队员名，逗号或换行分隔"
            value={draftNames[team.id] ?? ''}
            onChange={(e) => setDraftNames((d) => ({ ...d, [team.id]: e.target.value }))}
          />
          <PrimaryButton onClick={() => void addPlayers(team.id)}>添加队员</PrimaryButton>
        </Card>
      ))}

      <button
        type="button"
        className="w-full text-center text-sm text-primary"
        onClick={() => nav(`/events/${shortCode}`)}
      >
        完成，返回活动页
      </button>
    </PageShell>
  );
}
