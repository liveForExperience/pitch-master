export type ShareReportInput = {
  title: string;
  text: string;
  url: string;
  posterUrl?: string;
};

export type ShareReportResult = 'shared' | 'copied';

export function buildEventShareText(name: string, shortCode: string): string {
  return `${name} 活动战报 · 分享码 ${shortCode}`;
}

export function buildGameShareText(
  teamA: string,
  teamB: string,
  scoreA: number,
  scoreB: number,
): string {
  return `${teamA} ${scoreA}:${scoreB} ${teamB} · 单场战报`;
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

export async function fetchPosterBlob(posterUrl: string): Promise<Blob> {
  const res = await fetch(posterUrl);
  if (!res.ok) throw new Error('海报加载失败');
  return res.blob();
}

export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error('当前环境无法复制到剪贴板');
}

export async function shareReport(
  input: ShareReportInput,
  origin = '',
): Promise<ShareReportResult> {
  const url = reportPageUrl(input.url, origin);
  const message = `${input.text}\n${url}`;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      if (input.posterUrl && typeof navigator.canShare === 'function') {
        const blob = await fetchPosterBlob(input.posterUrl);
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

  await copyToClipboard(message);
  return 'copied';
}
