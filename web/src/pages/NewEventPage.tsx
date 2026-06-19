import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent, createTeam } from '../api/events';
import type { CreatedEvent } from '../api/types';
import { EventCredentialsCard } from '../components/EventCredentialsCard';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { useT } from '../i18n';
import { rememberEvent, setAdminToken } from '../lib/storage';

export function NewEventPage() {
  const t = useT();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState<string[]>([
    t('newEvent.defaults.teamA'),
    t('newEvent.defaults.teamB'),
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<CreatedEvent | null>(null);

  const syncTeamNames = (count: number) => {
    setTeamNames((prev) => {
      const next = [...prev];
      while (next.length < count) next.push(t('newEvent.defaults.team', { n: next.length + 1 }));
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
      setError(err instanceof Error ? err.message : t('newEvent.error.create'));
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
        const label = teamNames[i]?.trim() || t('newEvent.defaults.team', { n: i + 1 });
        await createTeam(created.id, label, created.adminToken);
      }
      nav(`/events/${created.shortCode}/setup`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('newEvent.error.teams'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title={t('newEvent.title')} backTo="/">
      {step === 1 && (
        <Card>
          <label className="mb-2 block text-sm text-textSec">{t('newEvent.step1.label')}</label>
          <input
            className="mb-4 w-full rounded-xl border border-border bg-surface px-3 py-3 text-textPri"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('newEvent.step1.placeholder')}
          />
          <PrimaryButton disabled={!name.trim()} onClick={() => setStep(2)}>
            {t('common.next')}
          </PrimaryButton>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <label className="mb-2 block text-sm text-textSec">{t('newEvent.step2.label')}</label>
          <input
            type="number"
            min={2}
            max={8}
            className="mb-4 w-full rounded-xl border border-border bg-surface px-3 py-3 text-textPri"
            value={teamCount}
            onChange={(e) => {
              const n = Number(e.target.value);
              setTeamCount(n);
              syncTeamNames(n);
            }}
          />
          <PrimaryButton onClick={() => setStep(3)}>{t('common.next')}</PrimaryButton>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <p className="mb-3 text-sm text-textSec">{t('newEvent.step3.hint')}</p>
          <div className="space-y-2">
            {teamNames.map((tn, i) => (
              <input
                key={i}
                className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-textPri"
                value={tn}
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
              {loading ? t('newEvent.step3.creating') : t('newEvent.step3.submit')}
            </PrimaryButton>
          </div>
        </Card>
      )}

      {step === 4 && created && (
        <>
          <EventCredentialsCard shortCode={created.shortCode} pin={created.pin} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <PrimaryButton disabled={loading} onClick={() => void finishSetup()}>
            {loading ? t('newEvent.step4.continuing') : t('newEvent.step4.continue')}
          </PrimaryButton>
        </>
      )}
    </PageShell>
  );
}
