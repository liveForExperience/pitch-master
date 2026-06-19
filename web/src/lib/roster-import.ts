/** Lines that are admin/meta, not player names. */
const SKIP_LINE = /人满|截止|接龙|报名开始|报名结束|已满/i;

const NUMBERED_LINE = /^\d+[\.\、\)）]\s*(.+)$/;

export type ParseSignupResult = {
  names: string[];
  skippedLines: string[];
  duplicateNames: string[];
};

/**
 * Parse WeChat group signup paste. Each numbered line → one player name (verbatim after序号).
 */
export function parseWechatSignupText(raw: string): ParseSignupResult {
  const names: string[] = [];
  const seen = new Set<string>();
  const skippedLines: string[] = [];
  const duplicateNames: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (SKIP_LINE.test(trimmed)) {
      skippedLines.push(trimmed);
      continue;
    }

    const numbered = trimmed.match(NUMBERED_LINE);
    const name = (numbered ? numbered[1] : trimmed).trim();
    if (!name) continue;

    if (seen.has(name)) {
      duplicateNames.push(name);
      continue;
    }
    seen.add(name);
    names.push(name);
  }

  return { names, skippedLines, duplicateNames };
}

/** Names in pool that are not yet on this team's roster. */
export function importNamesAvailableForTeam(
  pool: ReadonlyArray<string>,
  rosterNames: ReadonlyArray<string>,
): string[] {
  const onTeam = new Set(rosterNames.map((n) => n.trim()));
  return pool.filter((n) => !onTeam.has(n));
}
