import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent, createTeam } from '../api/events';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { rememberEvent, setAdminToken } from '../lib/storage';

export function NewEventPage() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState<string[]>(['红队', '蓝队']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const syncTeamNames = (count: number) => {
    setTeamNames((prev) => {
      const next = [...prev];
      while (next.length < count) next.push(`队伍 ${next.length + 1}`);
      return next.slice(0, count);
    });
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const created = await createEvent(name.trim());
      setAdminToken(created.id, created.adminToken);
      rememberEvent({
        id: created.id,
        shortCode: created.shortCode,
        name: name.trim(),
        pin: created.pin,
      });

      for (let i = 0; i < teamCount; i++) {
        const label = teamNames[i]?.trim() || `队伍 ${i + 1}`;
        await createTeam(created.id, label, created.adminToken);
      }

      nav(`/events/${created.shortCode}/setup`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="新建活动" backTo="/">
      {step === 1 && (
        <Card>
          <label className="mb-2 block text-sm text-textSec">活动名称</label>
          <input
            className="mb-4 w-full rounded-xl border border-border px-3 py-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="周二夜场"
          />
          <PrimaryButton disabled={!name.trim()} onClick={() => setStep(2)}>
            下一步
          </PrimaryButton>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <label className="mb-2 block text-sm text-textSec">参与队伍数</label>
          <input
            type="number"
            min={2}
            max={8}
            className="mb-4 w-full rounded-xl border border-border px-3 py-3"
            value={teamCount}
            onChange={(e) => {
              const n = Number(e.target.value);
              setTeamCount(n);
              syncTeamNames(n);
            }}
          />
          <PrimaryButton onClick={() => setStep(3)}>下一步</PrimaryButton>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <p className="mb-3 text-sm text-textSec">给每支队伍起个名字</p>
          <div className="space-y-2">
            {teamNames.map((t, i) => (
              <input
                key={i}
                className="w-full rounded-xl border border-border px-3 py-3"
                value={t}
                onChange={(e) => {
                  const next = [...teamNames];
                  next[i] = e.target.value;
                  setTeamNames(next);
                }}
              />
            ))}
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <div className="mt-4">
            <PrimaryButton disabled={loading} onClick={submit}>
              {loading ? '创建中…' : '创建并开始配置'}
            </PrimaryButton>
          </div>
        </Card>
      )}
    </PageShell>
  );
}
