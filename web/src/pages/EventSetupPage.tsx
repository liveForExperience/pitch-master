import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addRoster, createTeam, fetchEvent } from '../api/events';
import type { EventDetail } from '../api/types';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { getAdminToken } from '../lib/storage';

export function EventSetupPage() {
  const { shortCode = '' } = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [newTeam, setNewTeam] = useState('');
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const reload = () =>
    fetchEvent(shortCode)
      .then(setEvent)
      .catch((err: Error) => setError(err.message));

  useEffect(() => {
    void reload();
  }, [shortCode]);

  const token = event ? getAdminToken(event.id) : null;

  const addTeam = async () => {
    if (!event || !token || !newTeam.trim()) return;
    await createTeam(event.id, newTeam.trim(), token);
    setNewTeam('');
    await reload();
  };

  const addPlayers = async (teamId: string) => {
    if (!token) return;
    const raw = draftNames[teamId] ?? '';
    const names = raw.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    await addRoster(teamId, names, token);
    setDraftNames((d) => ({ ...d, [teamId]: '' }));
    await reload();
  };

  return (
    <PageShell title="队伍配置" backTo={`/events/${shortCode}`}>
      {error && <p className="text-sm text-danger">{error}</p>}
      {!token && <p className="text-sm text-warning">未找到管理员令牌，部分操作不可用。</p>}

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
    </PageShell>
  );
}
