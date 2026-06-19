import { useState } from 'react';
import { importNamesAvailableForTeam } from '../../lib/roster-import';

type Props = {
  teamName: string;
  pool: string[];
  rosterNames: string[];
  onAdd: (names: string[]) => Promise<void>;
};

export function TeamImportChips({ teamName, pool, rosterNames, onAdd }: Props) {
  const available = importNamesAvailableForTeam(pool, rosterNames);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  if (pool.length === 0) return null;

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const submit = async () => {
    const names = [...selected];
    if (!names.length) return;
    setBusy(true);
    try {
      await onAdd(names);
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-3 border-t border-border pt-3">
      <p className="mb-2 text-xs font-medium text-textSec">从导入名单添加到 {teamName}</p>
      {available.length === 0 ? (
        <p className="text-xs text-textSec">导入名单中的球员已全部在本队，或名单已空。</p>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap gap-2">
            {available.map((name) => {
              const on = selected.has(name);
              return (
                <button
                  key={name}
                  type="button"
                  disabled={busy}
                  onClick={() => toggle(name)}
                  className={`max-w-full truncate rounded-full border px-3 py-1.5 text-sm ${
                    on
                      ? 'border-primary bg-primaryPale text-primary'
                      : 'border-border bg-surface text-textPri'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={busy || selected.size === 0}
            onClick={() => void submit()}
            className="text-sm font-medium text-primary disabled:opacity-40"
          >
            {busy ? '添加中…' : `添加选中的 ${selected.size} 人`}
          </button>
        </>
      )}
    </div>
  );
}
