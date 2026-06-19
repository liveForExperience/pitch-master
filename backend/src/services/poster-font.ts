/**
 * Runtime CJK font subsetting for posters.
 *
 * Why this exists:
 *   The static NotoSC subset in [backend/src/assets/fonts] only covers business
 *   keywords ("积分榜", "射手榜", …) baked into [backend/scripts/prepare-fonts.mjs].
 *   Event names, team names and player names are user-typed and never appear
 *   in the static subset, so the static font would render most posters with
 *   missing glyphs.
 *
 * Strategy:
 *   - At first call we load the full NotoSC Bold .woff from @fontsource and
 *     keep it in memory.
 *   - For each render we collect every CJK character that could appear in the
 *     poster (event name, team names, player names, MVP), feed those into
 *     subset-font, and cache the resulting buffer by character-set hash.
 *   - The dynamic buffer is registered as a *second* NotoSC family next to the
 *     static one. Satori falls back to whichever buffer has the glyph.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import subsetFont from 'subset-font';

const require_ = createRequire(import.meta.url);

const MAX_CACHE_ENTRIES = 32;
const dynamicCache = new Map<string, Buffer>();

let cachedFullFont: Buffer | null = null;

function locateFullNotoSCBold(): string | null {
  const candidates = [
    'noto-sans-sc-chinese-simplified-700-normal.woff',
    'noto-sans-sc-chinese-simplified-700-normal.woff2',
  ];
  try {
    const pkgJsonPath = require_.resolve('@fontsource/noto-sans-sc/package.json');
    const pkgDir = path.dirname(pkgJsonPath);
    for (const name of candidates) {
      const p = path.join(pkgDir, 'files', name);
      if (fs.existsSync(p)) return p;
    }
  } catch {
    // ignored — surface as null so the caller can skip dynamic subsetting
  }
  return null;
}

function loadFullFont(): Buffer | null {
  if (cachedFullFont) return cachedFullFont;
  const sourcePath = locateFullNotoSCBold();
  if (!sourcePath) return null;
  cachedFullFont = fs.readFileSync(sourcePath);
  return cachedFullFont;
}

function uniqueCjkChars(strings: ReadonlyArray<string | null | undefined>): string {
  const set = new Set<string>();
  for (const s of strings) {
    if (!s) continue;
    for (const ch of s) {
      const cp = ch.codePointAt(0);
      if (cp == null) continue;
      // CJK Unified Ideographs + Extension A/B (common ranges in zh-Hans names)
      if (
        (cp >= 0x4e00 && cp <= 0x9fff) ||
        (cp >= 0x3400 && cp <= 0x4dbf) ||
        (cp >= 0x20000 && cp <= 0x2a6df)
      ) {
        set.add(ch);
      }
    }
  }
  return [...set].sort().join('');
}

/**
 * Returns a subset font buffer covering only the dynamic CJK characters in
 * `texts`. Returns null if the full NotoSC source is unavailable (e.g. dev
 * builds without fontsource installed) or no CJK character was found.
 */
export async function buildDynamicCjkSubset(
  texts: ReadonlyArray<string | null | undefined>,
): Promise<Buffer | null> {
  const charset = uniqueCjkChars(texts);
  if (!charset) return null;

  const cacheKey = createHash('sha1').update(charset).digest('hex');
  const cached = dynamicCache.get(cacheKey);
  if (cached) return cached;

  const source = loadFullFont();
  if (!source) return null;

  const buf = await subsetFont(source, charset, { targetFormat: 'woff' });
  const out = Buffer.from(buf);

  if (dynamicCache.size >= MAX_CACHE_ENTRIES) {
    const first = dynamicCache.keys().next().value;
    if (first) dynamicCache.delete(first);
  }
  dynamicCache.set(cacheKey, out);
  return out;
}

export function resetPosterDynamicFontCacheForTests(): void {
  dynamicCache.clear();
  cachedFullFont = null;
}
