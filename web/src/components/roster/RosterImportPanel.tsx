import { Trash } from '@phosphor-icons/react';
import { useState } from 'react';
import { useT } from '../../i18n';
import { parseWechatSignupText } from '../../lib/roster-import';

type Props = {
  pool: string[];
  onPoolChange: (names: string[]) => void;
};

export function RosterImportPanel({ pool, onPoolChange }: Props) {
  const t = useT();
  const [open, setOpen] = useState(pool.length > 0);
  const [paste, setPaste] = useState('');
  const [parseHint, setParseHint] = useState('');

  const parseAndMerge = () => {
    const { names, skippedLines, duplicateNames } = parseWechatSignupText(paste);
    if (names.length === 0) {
      setParseHint(
        skippedLines.length ? t('roster.empty.skipped') : t('roster.empty.needText'),
      );
      return;
    }
    const merged = [...pool];
    const seen = new Set(pool);
    let added = 0;
    for (const n of names) {
      if (seen.has(n)) continue;
      seen.add(n);
      merged.push(n);
      added += 1;
    }
    onPoolChange(merged);
    setPaste('');
    const parts: string[] = [t('roster.added', { count: added })];
    if (skippedLines.length) parts.push(t('roster.skipped', { count: skippedLines.length }));
    if (duplicateNames.length) parts.push(t('roster.duplicates', { count: duplicateNames.length }));
    setParseHint(parts.join(' · '));
  };

  const removeFromPool = (name: string) => {
    onPoolChange(pool.filter((n) => n !== name));
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-chipBg/40"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold tracking-tight text-textPri">{t('roster.title')}</span>
        <span className="font-mono text-xs tabular-nums text-textSec">
          {pool.length
            ? t('roster.pending', { count: pool.length })
            : open
              ? t('home.collapse')
              : t('home.expand')}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-border px-4 py-4">
          <p className="text-xs leading-relaxed text-textSec">{t('roster.help')}</p>
          <textarea
            className="w-full resize-none rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm leading-relaxed text-textPri outline-none focus:border-primary"
            rows={5}
            placeholder={t('roster.placeholder')}
            value={paste}
            onChange={(e) => {
              setPaste(e.target.value);
              setParseHint('');
            }}
          />
          <button
            type="button"
            className="w-full rounded-lg bg-textPri px-4 py-2.5 text-sm font-semibold text-textInv active:scale-[0.98]"
            onClick={parseAndMerge}
          >
            {t('roster.parse')}
          </button>
          {parseHint && <p className="text-xs text-textSec">{parseHint}</p>}

          {pool.length > 0 && (
            <div className="rounded-lg border border-border bg-elevated/80 p-3">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-textSec">{t('roster.poolHeader')}</p>
                <span className="font-mono text-[11px] tabular-nums text-textSec">{pool.length}</span>
              </div>
              <ul className="flex min-w-0 flex-wrap gap-1.5">
                {pool.map((name) => (
                  <li key={name} className="min-w-0 max-w-full">
                    <span className="flex w-max max-w-full min-w-0 items-center gap-1 rounded-lg border border-border bg-surface py-1 pl-2.5 pr-1 text-sm text-textPri">
                      <span className="min-w-0 truncate" title={name}>
                        {name}
                      </span>
                      <button
                        type="button"
                        className="flex shrink-0 items-center rounded-md px-1.5 py-1 text-textSec transition-colors hover:bg-chipBg hover:text-danger"
                        aria-label={t('roster.deleteFromPool', { name })}
                        onClick={() => removeFromPool(name)}
                      >
                        <Trash size={13} weight="bold" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
