/**
 * On-demand poster assets for Satori (emoji SVG + missing CJK glyphs).
 *
 * Satori renders in two passes: the first pass discovers missing graphemes, then
 * calls `loadAdditionalAsset` before re-rendering. Emoji need Twemoji SVGs;
 * rare CJK characters need an extra PosterCJK subset for the missing segment.
 */
import { buildDynamicCjkFonts, dynamicCjkToSatoriFonts } from './poster-font.js';

const TWEMOJI_VERSION = '14.0.2';
const TWEMOJI_CDN = `https://cdn.jsdelivr.net/gh/twitter/twemoji@${TWEMOJI_VERSION}/assets/svg`;

const emojiSvgCache = new Map<string, string>();

type PosterFontAsset = {
  name: string;
  data: Buffer;
  weight: 400 | 700;
  style: 'normal';
};

/** Twemoji file slug, e.g. "🎉" → "1f389", "👨‍👩‍👧" → "1f468-200d-1f469-200d-1f467". */
export function emojiToTwemojiSlug(segment: string): string {
  const parts: string[] = [];
  for (const ch of segment) {
    const cp = ch.codePointAt(0);
    if (cp != null) parts.push(cp.toString(16));
  }
  return parts.join('-');
}

export async function loadEmojiSvg(segment: string): Promise<string | null> {
  const cached = emojiSvgCache.get(segment);
  if (cached) return cached;

  const slug = emojiToTwemojiSlug(segment);
  const url = `${TWEMOJI_CDN}/${slug}.svg`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const raw = await res.text();
    const svg = `data:image/svg+xml;base64,${Buffer.from(raw).toString('base64')}`;
    emojiSvgCache.set(segment, svg);
    return svg;
  } catch {
    return null;
  }
}

function isCjkLanguageCode(languageCode: string): boolean {
  return (
    languageCode.includes('zh-') ||
    languageCode.includes('ja-JP') ||
    languageCode === 'unknown'
  );
}

async function loadMissingCjkFont(segment: string): Promise<PosterFontAsset[]> {
  return dynamicCjkToSatoriFonts(await buildDynamicCjkFonts([segment]));
}

export async function loadAdditionalPosterAsset(
  languageCode: string,
  segment: string,
): Promise<string | PosterFontAsset[]> {
  if (languageCode === 'emoji') {
    const svg = await loadEmojiSvg(segment);
    if (!svg) throw new Error(`Emoji asset not found: ${segment}`);
    return svg;
  }

  if (isCjkLanguageCode(languageCode)) {
    return loadMissingCjkFont(segment);
  }

  throw new Error(`Unsupported poster asset: ${languageCode}`);
}

export function resetPosterEmojiCacheForTests(): void {
  emojiSvgCache.clear();
}
