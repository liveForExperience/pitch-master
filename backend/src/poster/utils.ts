export function formatPosterDate(epochMs: number): string {
  const d = new Date(epochMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

export function formatDurationMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function goalDiffLabel(diff: number): string {
  if (diff > 0) return `+${diff}`;
  return String(diff);
}

const MONTH_CAPS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** Date eyebrow in editorial caps: "MAR 14 · 18:30". */
export function formatHeaderDate(epochMs: number, withTime = true): string {
  const d = new Date(epochMs);
  const month = MONTH_CAPS[d.getMonth()] ?? '---';
  const day = String(d.getDate()).padStart(2, '0');
  if (!withTime) return `${month} ${day}`;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${month} ${day} · ${hh}:${mm}`;
}

/** Range eyebrow used by event poster header: "MAR 14 - 16" or "MAR 14 · APR 02". */
export function formatHeaderRange(startMs: number, endMs: number | null): string {
  if (!endMs || endMs === startMs) return formatHeaderDate(startMs, false);
  const s = new Date(startMs);
  const e = new Date(endMs);
  const sMonth = MONTH_CAPS[s.getMonth()] ?? '---';
  const eMonth = MONTH_CAPS[e.getMonth()] ?? '---';
  const sDay = String(s.getDate()).padStart(2, '0');
  const eDay = String(e.getDate()).padStart(2, '0');
  if (sMonth === eMonth && s.getFullYear() === e.getFullYear()) {
    return `${sMonth} ${sDay} - ${eDay}`;
  }
  return `${sMonth} ${sDay} · ${eMonth} ${eDay}`;
}
