import { useState } from 'react';
import { Card, PrimaryButton } from '../ui/layout';
import { parseWechatSignupText } from '../../lib/roster-import';

type Props = {
  pool: string[];
  onPoolChange: (names: string[]) => void;
};

export function RosterImportPanel({ pool, onPoolChange }: Props) {
  const [open, setOpen] = useState(pool.length > 0);
  const [paste, setPaste] = useState('');
  const [parseHint, setParseHint] = useState('');

  const parseAndMerge = () => {
    const { names, skippedLines, duplicateNames } = parseWechatSignupText(paste);
    if (names.length === 0) {
      setParseHint(
        skippedLines.length
          ? '未解析到球员，已跳过非名单行'
          : '请先粘贴带序号的报名文本',
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
    const parts: string[] = [`已加入 ${added} 人`];
    if (skippedLines.length) parts.push(`跳过 ${skippedLines.length} 行`);
    if (duplicateNames.length) parts.push(`重复 ${duplicateNames.length} 人`);
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
        <span className="font-semibold text-textPri">快速导入报名名单</span>
        <span className="text-sm text-textSec">
          {pool.length ? `${pool.length} 人待分配` : open ? '收起' : '展开'}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <p className="text-xs text-textSec">
            从微信群复制接龙文本粘贴到下方，每行序号后内容即一名球员（含 emoji、+1、门 等后缀原样保留）。
          </p>
          <textarea
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            rows={5}
            placeholder="1. 张三&#10;2. 李四&#10;…"
            value={paste}
            onChange={(e) => {
              setPaste(e.target.value);
              setParseHint('');
            }}
          />
          <PrimaryButton className="min-h-12" onClick={parseAndMerge}>
            解析并加入名单
          </PrimaryButton>
          {parseHint && <p className="text-xs text-textSec">{parseHint}</p>}

          {pool.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-textSec">待分配球员</p>
              <ul className="flex flex-wrap gap-2">
                {pool.map((name) => (
                  <li key={name}>
                    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-chipBg px-3 py-1 text-sm">
                      <span className="truncate">{name}</span>
                      <button
                        type="button"
                        className="shrink-0 text-textSec hover:text-danger"
                        aria-label={`移除 ${name}`}
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
