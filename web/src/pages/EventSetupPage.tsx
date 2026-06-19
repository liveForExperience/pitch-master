import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  addRoster,
  deleteTeam as deleteTeamApi,
  fetchEvent,
  removeRosterMember as removeRosterMemberApi,
  updateTeamName,
} from '../api/events';
import { ApiError } from '../api/client';
import type { EventDetail } from '../api/types';
import { RosterImportPanel } from '../components/roster/RosterImportPanel';
import { TeamSetupCard } from '../components/roster/TeamSetupCard';
import { Tour } from '../components/tour/Tour';
import { EVENT_SETUP_TOUR_STEPS, TOUR_IDS } from '../components/tour/tour-config';
import { usePageTour } from '../components/tour/use-page-tour';
import { ConfirmDangerDialog } from '../components/ui/confirm-danger-dialog';
import { PageShell } from '../components/ui/layout';
import { useT } from '../i18n';
import { mergeIntoPool, nameReturnsToPool } from '../lib/roster-pool';
import {
  clearRosterImportPool,
  loadRosterImportPool,
  saveRosterImportPool,
} from '../lib/roster-import-store';
import { useRequireAdmin } from '../lib/use-require-admin';

export function EventSetupPage() {
  const t = useT();
  const { shortCode = '' } = useParams();
  const nav = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [newTeam, setNewTeam] = useState('');
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [importPool, setImportPool] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [deleteTeamTarget, setDeleteTeamTarget] = useState<{ id: string; name: string } | null>(null);
  const [deletingTeam, setDeletingTeam] = useState(false);

  const reload = () =>
    fetchEvent(shortCode)
      .then(setEvent)
      .catch((err: Error) => setError(err.message));

  useEffect(() => {
    void reload();
  }, [shortCode]);

  const token = useRequireAdmin(event?.id, `/events/${shortCode}`);

  const tour = usePageTour(TOUR_IDS.eventSetup, {
    ready: Boolean(event && token),
  });

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
      <PageShell title={t('setup.title')} backTo={`/events/${shortCode}`}>
        <p className="text-sm text-textSec">{t('common.redirecting')}</p>
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

  const addPlayers = async (teamId: string, chipNames: string[]) => {
    const raw = draftNames[teamId] ?? '';
    const manualNames = raw.split(/[,，\n]/).map((s) => s.trim()).filter(Boolean);
    const allNames = [...chipNames, ...manualNames];
    if (!allNames.length) return;

    await addRoster(teamId, allNames, token);

    if (chipNames.length) {
      setImportPool((prev) => {
        const next = prev.filter((n) => !chipNames.includes(n));
        if (event?.id) saveRosterImportPool(event.id, next);
        return next;
      });
    }
    if (manualNames.length) {
      setDraftNames((d) => ({ ...d, [teamId]: '' }));
    }
    await reload();
  };

  const renameTeam = async (teamId: string, name: string) => {
    await updateTeamName(teamId, name, token);
    await reload();
  };

  const removePlayer = async (teamId: string, rosterId: string, playerName: string) => {
    try {
      await removeRosterMemberApi(rosterId, token);
      if (event && nameReturnsToPool(playerName, event.teams, teamId)) {
        setImportPool((prev) => {
          const next = mergeIntoPool(prev, playerName);
          saveRosterImportPool(event.id, next);
          return next;
        });
      }
      await reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('setup.removePlayerError');
      setError(message);
    }
  };

  const requestDeleteTeam = (teamId: string, teamName: string) => {
    setError('');
    setDeleteTeamTarget({ id: teamId, name: teamName });
  };

  const confirmDeleteTeam = async () => {
    if (!deleteTeamTarget) return;
    setDeletingTeam(true);
    setError('');
    try {
      // Return everyone on the deleted team back to the import pool so the
      // admin doesn't lose the signup data they already typed/pasted.
      const removedTeam = event?.teams.find((t) => t.id === deleteTeamTarget.id);
      const namesToReturn =
        removedTeam?.roster
          .map((p) => p.name)
          .filter((name) =>
            event ? nameReturnsToPool(name, event.teams, removedTeam.id) : false,
          ) ?? [];

      await deleteTeamApi(deleteTeamTarget.id, token);

      if (event && namesToReturn.length > 0) {
        setImportPool((prev) => {
          let next = prev;
          for (const name of namesToReturn) {
            next = mergeIntoPool(next, name);
          }
          saveRosterImportPool(event.id, next);
          return next;
        });
      }
      setDeleteTeamTarget(null);
      await reload();
    } catch (err) {
      const message =
        err instanceof ApiError && err.code === 'conflict'
          ? t('setup.deleteTeam.cannotDelete')
          : err instanceof Error
            ? err.message
            : t('setup.deleteTeam.error');
      setError(message);
    } finally {
      setDeletingTeam(false);
    }
  };

  return (
    <PageShell title={t('setup.title')} backTo={`/events/${shortCode}`}>
      {error && (
        <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div data-tour="setup-import">
        <RosterImportPanel
          pool={importPool}
          onPoolChange={updateImportPool}
          forceOpen={tour.open}
        />
      </div>

      <section
        data-tour="setup-new-team"
        className="rounded-xl border border-border bg-surface p-4"
      >
        <label className="mb-2 block text-xs font-medium text-textSec">
          {t('setup.newTeamPlaceholder')}
        </label>
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-textPri outline-none focus:border-primary"
            placeholder={t('setup.newTeamPlaceholder')}
            value={newTeam}
            onChange={(e) => setNewTeam(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void addTeam();
            }}
          />
          <button
            type="button"
            className="shrink-0 rounded-lg bg-textPri px-4 py-2.5 text-sm font-semibold text-textInv active:scale-[0.98] disabled:opacity-40"
            disabled={!newTeam.trim()}
            onClick={() => void addTeam()}
          >
            {t('common.add')}
          </button>
        </div>
      </section>

      <div className="space-y-3">
        {event?.teams.map((team, idx) => (
          <div key={team.id} data-tour={idx === 0 ? 'setup-team-card' : undefined}>
            <TeamSetupCard
              team={team}
              importPool={importPool}
              draftValue={draftNames[team.id] ?? ''}
              adminToken={token}
              onDraftChange={(value) => setDraftNames((d) => ({ ...d, [team.id]: value }))}
              onRename={renameTeam}
              onAddPlayers={addPlayers}
              onRemovePlayer={removePlayer}
              onDeleteTeam={requestDeleteTeam}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        data-tour="setup-done"
        className="w-full py-2 text-center text-sm font-medium text-primary"
        onClick={() => nav(`/events/${shortCode}`)}
      >
        {t('setup.done')}
      </button>

      <Tour
        tourId={TOUR_IDS.eventSetup}
        steps={EVENT_SETUP_TOUR_STEPS}
        open={tour.open}
        onClose={tour.close}
      />

      <ConfirmDangerDialog
        open={Boolean(deleteTeamTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTeamTarget(null);
        }}
        title={t('setup.deleteTeam.title', { name: deleteTeamTarget?.name ?? '' })}
        description={t('setup.deleteTeam.desc')}
        confirmLabel={t('setup.deleteTeam.confirm')}
        processingLabel={t('setup.deleteTeam.processing')}
        processing={deletingTeam}
        onConfirm={() => void confirmDeleteTeam()}
      />
    </PageShell>
  );
}
