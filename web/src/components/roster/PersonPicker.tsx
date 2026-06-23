import { useEffect, useMemo, useState } from 'react';
import { Check } from '@phosphor-icons/react';
import type { Person } from '../../api/types';
import { listPersons } from '../../api/persons';
import { useT } from '../../i18n';
import { loadRecentPersonIds } from '../../lib/person-store';

type Props = {
  teamName: string;
  rosterPersonIds: ReadonlySet<string>;
  selected: ReadonlySet<string>;
  onToggle: (personId: string) => void;
};

export function PersonPicker({ teamName, rosterPersonIds, selected, onToggle }: Props) {
  const t = useT();
  const [persons, setPersons] = useState<Person[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listPersons()
      .then((res) => {
        if (!cancelled) setPersons(res.persons);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const recentIds = useMemo(() => new Set(loadRecentPersonIds()), []);

  const sorted = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? persons.filter((p) => p.displayName.toLowerCase().includes(q))
      : persons;
    return [...filtered].sort((a, b) => {
      const aRecent = recentIds.has(a.id) ? 0 : 1;
      const bRecent = recentIds.has(b.id) ? 0 : 1;
      return aRecent - bRecent || b.updatedAt - a.updatedAt;
    });
  }, [persons, filter, recentIds]);

  if (loading) {
    return <p className="text-xs text-textSec">{t('personPicker.loading')}</p>;
  }
  if (error) {
    return <p className="text-xs text-danger">{error}</p>;
  }
  if (persons.length === 0) {
    return <p className="text-xs text-textSec">{t('personPicker.empty')}</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-textSec">
        {t('personPicker.title', { team: teamName })}
      </p>
      <input
        type="search"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-textPri outline-none focus:border-primary"
        placeholder={t('personPicker.search')}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {sorted.length === 0 ? (
        <p className="text-xs text-textSec">{t('personPicker.noMatch')}</p>
      ) : (
        <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {sorted.map((person) => {
            const onTeam = rosterPersonIds.has(person.id);
            const on = selected.has(person.id);
            return (
              <button
                key={person.id}
                type="button"
                disabled={onTeam}
                onClick={() => onToggle(person.id)}
                className={`flex w-max max-w-full min-w-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
                  on
                    ? 'border-primary bg-primaryPale text-primary'
                    : 'border-border bg-elevated text-textPri hover:border-primary/30'
                }`}
              >
                {on && <Check size={12} weight="bold" className="shrink-0" />}
                <span className="min-w-0 truncate" title={person.displayName}>
                  {person.displayName}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
