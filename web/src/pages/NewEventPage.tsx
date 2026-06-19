import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent, createTeam } from '../api/events';
import type { CreatedEvent } from '../api/types';
import { EventCredentialsCard } from '../components/EventCredentialsCard';
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
  const [created, setCreated] = useState<CreatedEvent | null>(null);

  const syncTeamNames = (count: number) => {
    setTeamNames((prev) => {
      const next = [...prev];
      while (next.length < count) next.push(`队伍 ${next.length + 1}`);
      return next.slice(0, count);
    });
  };

  const createActivity = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await createEvent(name.trim());
      setAdminToken(result.id, result.adminToken);
      rememberEvent({
        id: result.id,
        shortCode: result.shortCode,
        name: name.trim(),
        pin: result.pin,
        createdAt: result.createdAt,
      });
      setCreated(result);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const finishSetup = async () => {
    if (!created) return;
    setLoading(true);
    setError('');
    try {
      for (let i = 0; i < teamCount; i++) {
        const label = teamNames[i]?.trim() || `队伍 ${i + 1}`;
        await createTeam(created.id, label, created.adminToken);
      }
      nav(`/events/${created.shortCode}/setup`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建队伍失败');
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
            <PrimaryButton disabled={loading} onClick={() => void createActivity()}>
              {loading ? '创建中…' : '创建活动'}
            </PrimaryButton>
          </div>
        </Card>
      )}

      {step === 4 && created && (
        <>
          <EventCredentialsCard shortCode={created.shortCode} pin={created.pin} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <PrimaryButton disabled={loading} onClick={() => void finishSetup()}>
            {loading ? '配置队伍中…' : '已截图保存，继续配置队员'}
          </PrimaryButton>
        </>
      )}
    </PageShell>
  );
}
