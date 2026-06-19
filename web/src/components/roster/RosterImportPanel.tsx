import { useState } from 'react';
import { Card, PrimaryButton } from '../ui/layout';
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
    <Card>
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-semibold text-textPri">{t('roster.title')}</span>
        <span className="text-sm text-textSec">
          {pool.length
            ? t('roster.pending', { count: pool.length })
            : open
              ? t('home.collapse')
              : t('home.expand')}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <p className="text-xs text-textSec">{t('roster.help')}</p>
          <textarea
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-textPri"
            rows={5}
            placeholder={t('roster.placeholder')}
            value={paste}
            onChange={(e) => {
              setPaste(e.target.value);
              setParseHint('');
            }}
          />
          <PrimaryButton className="min-h-12" onClick={parseAndMerge}>
            {t('roster.parse')}
          </PrimaryButton>
          {parseHint && <p className="text-xs text-textSec">{parseHint}</p>}

          {pool.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-textSec">{t('roster.poolHeader')}</p>
              <ul className="flex flex-wrap gap-2">
                {pool.map((name) => (
                  <li key={name}>
                    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-chipBg px-3 py-1 text-sm">
                      <span className="truncate">{name}</span>
                      <button
                        type="button"
                        className="shrink-0 text-textSec hover:text-danger"
                        aria-label={t('roster.remove', { name })}
                        onClick={() => removeFromPool(name)}
                      >
                        ×
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
