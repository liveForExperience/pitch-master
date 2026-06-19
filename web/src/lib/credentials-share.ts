import { t as defaultT } from '../i18n';
import { copyToClipboard, reportPageUrl } from './share-report';

type T = (key: string, params?: Record<string, string | number>) => string;

export function eventWatchPath(shortCode: string): string {
  return `/events/${encodeURIComponent(shortCode.trim().toUpperCase())}`;
}

export function buildCredentialsShareText(
  input: {
    shortCode: string;
    pin: string;
    eventName?: string;
    origin?: string;
  },
  t: T = defaultT,
): string {
  const code = input.shortCode.trim().toUpperCase();
  const url = reportPageUrl(eventWatchPath(code), input.origin);
  const lines = [t('cred.shareText.title')];

  if (input.eventName?.trim()) {
    lines.push(t('cred.shareText.event', { name: input.eventName.trim() }));
  }

  lines.push(
    '',
    t('cred.shareText.codeLine', { code }),
    t('cred.shareText.pinLine', { pin: input.pin }),
    '',
    t('cred.shareText.codeHint'),
    t('cred.shareText.pinHint'),
    '',
    url,
  );

  return lines.join('\n');
}

export async function shareCredentialsText(
  text: string,
  title: string,
  t: T = defaultT,
): Promise<'shared' | 'copied'> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err;
    }
  }

  await copyToClipboard(text, t);
  return 'copied';
}
