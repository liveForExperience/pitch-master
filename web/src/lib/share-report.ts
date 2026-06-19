import { t as defaultT } from '../i18n';

export type ShareReportInput = {
  title: string;
  text: string;
  url: string;
  posterUrl?: string;
};

export type ShareReportResult = 'shared' | 'copied';

type T = (key: string, params?: Record<string, string | number>) => string;

export function buildEventShareText(
  name: string,
  shortCode: string,
  t: T = defaultT,
): string {
  return t('share.event.copy', { name, code: shortCode });
}

export function buildGameShareText(
  teamA: string,
  teamB: string,
  scoreA: number,
  scoreB: number,
  t: T = defaultT,
): string {
  return t('share.game.copy', { teamA, teamB, scoreA, scoreB });
}

export function reportPageUrl(path: string, origin = ''): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  if (!base) return path;
  return new URL(path, base).href;
}

export function eventReportPath(shortCode: string): string {
  return `/events/${encodeURIComponent(shortCode)}/report`;
}

export function gameReportPath(gameId: string): string {
  return `/games/${encodeURIComponent(gameId)}/report`;
}

export async function fetchPosterBlob(
  posterUrl: string,
  t: T = defaultT,
): Promise<Blob> {
  const res = await fetch(posterUrl);
  if (!res.ok) throw new Error(t('common.error.posterLoad'));
  return res.blob();
}

function copyWithExecCommand(text: string): boolean {
  if (typeof document === 'undefined') return false;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
  return ok;
}

export async function copyToClipboard(
  text: string,
  t: T = defaultT,
): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // HTTP 等非安全上下文可能暴露 API 但调用失败，继续走 execCommand。
    }
  }

  if (copyWithExecCommand(text)) return;

  throw new Error(t('common.error.clipboard'));
}

export async function shareReport(
  input: ShareReportInput,
  origin = '',
  t: T = defaultT,
): Promise<ShareReportResult> {
  const url = reportPageUrl(input.url, origin);
  const message = `${input.text}\n${url}`;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      if (input.posterUrl && typeof navigator.canShare === 'function') {
        const blob = await fetchPosterBlob(input.posterUrl, t);
        const file = new File([blob], 'pitchmaster-report.png', {
          type: blob.type || 'image/png',
        });
        const withFiles: ShareData = {
          title: input.title,
          text: message,
          files: [file],
        };
        if (navigator.canShare(withFiles)) {
          await navigator.share(withFiles);
          return 'shared';
        }
      }

      await navigator.share({
        title: input.title,
        text: message,
        url,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err;
    }
  }

  await copyToClipboard(message, t);
  return 'copied';
}
