import { PencilSimple, Trash, UserMinus, X } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import type { Team } from '../../api/types';
import { useT } from '../../i18n';
import { PersonPicker } from './PersonPicker';
import { PersonRenameDialog } from './PersonRenameDialog';
import { TeamImportChips } from './TeamImportChips';

type AddTab = 'manual' | 'regulars';

type Props = {
  team: Team;
  importPool: string[];
  draftValue: string;
  adminToken: string;
  onDraftChange: (value: string) => void;
  onRename: (teamId: string, name: string) => Promise<void>;
  onAddPlayers: (teamId: string, chipNames: string[]) => Promise<void>;
  onAddPersonIds: (teamId: string, personIds: string[]) => Promise<void>;
  onRemovePlayer: (teamId: string, rosterId: string, playerName: string) => Promise<void>;
  onPlayerRenamed: () => void;
  onDeleteTeam?: (teamId: string, teamName: string) => void;
  tourAddPlayers?: boolean;
};

export function TeamSetupCard({
  team,
  importPool,
  draftValue,
  adminToken,
  onDraftChange,
  onRename,
  onAddPlayers,
  onAddPersonIds,
  onRemovePlayer,
  onPlayerRenamed,
  onDeleteTeam,
  tourAddPlayers,
}: Props) {
  const t = useT();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(team.name);
  const [savingName, setSavingName] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [addTab, setAddTab] = useState<AddTab>('manual');
  const [selectedPersons, setSelectedPersons] = useState<Set<string>>(new Set());
  const [renameTarget, setRenameTarget] = useState<{ personId: string; name: string } | null>(
    null,
  );

  const rosterPersonIds = useMemo(
    () => new Set(team.roster.map((p) => p.personId)),
    [team.roster],
  );

  useEffect(() => {
    if (!editingName) setNameDraft(team.name);
  }, [team.name, editingName]);

  const saveName = async () => {
    const next = nameDraft.trim();
    if (!next || next === team.name) {
      setEditingName(false);
      setNameDraft(team.name);
      return;
    }
    setSavingName(true);
    try {
      await onRename(team.id, next);
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  };

  const manualCount = draftValue
    .split(/[,，\n]/)
    .map((s) => s.trim())
    .filter(Boolean).length;
  const chipCount = selectedChips.size;
  const manualAddCount = chipCount + manualCount;
  const regularAddCount = selectedPersons.size;

  const toggleChip = (name: string) => {
    setSelectedChips((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const togglePerson = (personId: string) => {
    setSelectedPersons((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  };

  const submitManualPlayers = async () => {
    if (manualAddCount === 0) return;
    setAdding(true);
    try {
      await onAddPlayers(team.id, [...selectedChips]);
      setSelectedChips(new Set());
    } finally {
      setAdding(false);
    }
  };

  const submitRegularPlayers = async () => {
    if (regularAddCount === 0) return;
    setAdding(true);
    try {
      await onAddPersonIds(team.id, [...selectedPersons]);
      setSelectedPersons(new Set());
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-surface">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/5"
          style={{ background: team.colorHex }}
          aria-hidden
        />
        {editingName ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input
              className="min-w-0 flex-1 rounded-lg border border-border bg-elevated px-2.5 py-1.5 text-base font-semibold text-textPri outline-none focus:border-primary"
              value={nameDraft}
              disabled={savingName}
              autoFocus
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void saveName();
                if (e.key === 'Escape') {
                  setEditingName(false);
                  setNameDraft(team.name);
                }
              }}
            />
            <button
              type="button"
              disabled={savingName}
              className="shrink-0 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-textInv active:scale-[0.98] disabled:opacity-50"
              onClick={() => void saveName()}
            >
              {t('common.save')}
            </button>
            <button
              type="button"
              className="shrink-0 rounded-md p-1.5 text-textSec hover:text-textPri"
              aria-label={t('common.cancel')}
              onClick={() => {
                setEditingName(false);
                setNameDraft(team.name);
              }}
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        ) : (
          <>
            <h3 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-textPri">
              {team.name}
            </h3>
            <button
              type="button"
              className="shrink-0 rounded-md p-1.5 text-textSec transition-colors hover:bg-chipBg hover:text-textPri"
              aria-label={t('setup.editTeamName')}
              onClick={() => setEditingName(true)}
            >
              <PencilSimple size={16} weight="bold" />
            </button>
            {onDeleteTeam && (
              <button
                type="button"
                className="shrink-0 rounded-md p-1.5 text-textSec transition-colors hover:bg-danger/10 hover:text-danger"
                aria-label={t('setup.deleteTeam.aria', { name: team.name })}
                onClick={() => onDeleteTeam(team.id, team.name)}
              >
                <Trash size={16} weight="bold" />
              </button>
            )}
          </>
        )}
        <span className="shrink-0 font-mono text-xs tabular-nums text-textSec">
          {team.roster.length}
        </span>
      </header>

      {team.roster.length > 0 ? (
        <ul className="divide-y divide-border">
          {team.roster.map((player) => (
            <li key={player.id} className="flex items-center gap-2 px-4 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm text-textPri">{player.name}</span>
              <button
                type="button"
                disabled={!adminToken}
                className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-textSec transition-colors hover:bg-chipBg hover:text-textPri disabled:opacity-40"
                aria-label={t('personRename.aria', { name: player.name })}
                onClick={() => setRenameTarget({ personId: player.personId, name: player.name })}
              >
                <PencilSimple size={14} weight="bold" />
              </button>
              <button
                type="button"
                disabled={removingId === player.id || !adminToken}
                className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-textSec transition-colors hover:bg-chipBg hover:text-danger disabled:opacity-40"
                aria-label={t('setup.removePlayer', { name: player.name })}
                onClick={() => {
                  setRemovingId(player.id);
                  void onRemovePlayer(team.id, player.id, player.name).finally(() =>
                    setRemovingId(null),
                  );
                }}
              >
                <UserMinus size={14} weight="bold" />
                <span>{t('setup.remove')}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-3 text-sm text-textSec">{t('setup.noPlayersYet')}</p>
      )}

      <div
        className="space-y-3 border-t border-border bg-elevated/60 px-4 py-4"
        data-tour={tourAddPlayers ? 'setup-add-players' : undefined}
      >
        <div className="flex gap-1 rounded-lg bg-chipBg p-1">
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              addTab === 'manual' ? 'bg-surface text-textPri shadow-sm' : 'text-textSec'
            }`}
            onClick={() => setAddTab('manual')}
          >
            {t('setup.tabManual')}
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              addTab === 'regulars' ? 'bg-surface text-textPri shadow-sm' : 'text-textSec'
            }`}
            onClick={() => setAddTab('regulars')}
          >
            {t('setup.tabRegulars')}
          </button>
        </div>

        {addTab === 'manual' ? (
          <>
            <TeamImportChips
              teamName={team.name}
              pool={importPool}
              rosterNames={team.roster.map((p) => p.name)}
              selected={selectedChips}
              onToggle={toggleChip}
            />
            <div className="space-y-2">
              <label className="block text-xs font-medium text-textSec">
                {t('setup.addRosterPlaceholder')}
              </label>
              <textarea
                className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2.5 text-sm leading-relaxed text-textPri outline-none transition-colors focus:border-primary"
                rows={2}
                placeholder={t('setup.addRosterHint')}
                value={draftValue}
                onChange={(e) => onDraftChange(e.target.value)}
              />
              <button
                type="button"
                disabled={adding || manualAddCount === 0}
                className="w-full rounded-lg bg-textPri px-4 py-2.5 text-sm font-semibold text-textInv transition-transform active:scale-[0.98] disabled:opacity-40"
                onClick={() => void submitManualPlayers()}
              >
                {adding
                  ? t('setup.addingPlayers')
                  : manualAddCount > 1
                    ? t('setup.addPlayersCount', { count: manualAddCount })
                    : t('setup.addRoster')}
              </button>
            </div>
          </>
        ) : (
          <>
            <PersonPicker
              teamName={team.name}
              rosterPersonIds={rosterPersonIds}
              selected={selectedPersons}
              onToggle={togglePerson}
            />
            <button
              type="button"
              disabled={adding || regularAddCount === 0}
              className="w-full rounded-lg bg-textPri px-4 py-2.5 text-sm font-semibold text-textInv transition-transform active:scale-[0.98] disabled:opacity-40"
              onClick={() => void submitRegularPlayers()}
            >
              {adding
                ? t('setup.addingPlayers')
                : regularAddCount > 1
                  ? t('setup.addPlayersCount', { count: regularAddCount })
                  : t('setup.addRegular')}
            </button>
          </>
        )}
      </div>

      {renameTarget && (
        <PersonRenameDialog
          key={renameTarget.personId}
          personId={renameTarget.personId}
          currentName={renameTarget.name}
          open={Boolean(renameTarget)}
          onOpenChange={(open) => {
            if (!open) setRenameTarget(null);
          }}
          onRenamed={onPlayerRenamed}
        />
      )}
    </article>
  );
}
