import { Check } from '@phosphor-icons/react';
import { importNamesAvailableForTeam } from '../../lib/roster-import';
import { useT } from '../../i18n';

type Props = {
  teamName: string;
  pool: string[];
  rosterNames: string[];
  selected: ReadonlySet<string>;
  onToggle: (name: string) => void;
};

export function TeamImportChips({ teamName, pool, rosterNames, selected, onToggle }: Props) {
  const t = useT();
  const available = importNamesAvailableForTeam(pool, rosterNames);

  if (pool.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="mb-2.5 text-xs font-medium text-textSec">
        {t('chips.title', { team: teamName })}
      </p>
      {available.length === 0 ? (
        <p className="text-xs leading-relaxed text-textSec">{t('chips.allOnTeam')}</p>
      ) : (
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {available.map((name) => {
            const on = selected.has(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => onToggle(name)}
                className={`flex w-max max-w-full min-w-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors active:scale-[0.98] ${
                  on
                    ? 'border-primary bg-primaryPale text-primary'
                    : 'border-border bg-elevated text-textPri hover:border-primary/30'
                }`}
              >
                {on && <Check size={12} weight="bold" className="shrink-0" />}
                <span className="min-w-0 truncate" title={name}>
                  {name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
