/**
 * Runtime font subsetting for posters.
 *
 * Primary: Noto Sans SC. CJK extension: Noto Sans JP chunks. Latin extension:
 * Noto Sans latin / latin-ext for diacritics absent from SC (e.g. ş, ų, ġ).
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import opentype from '@shuding/opentype.js';
import subsetFont from 'subset-font';

const require_ = createRequire(import.meta.url);

const MAX_CACHE_ENTRIES = 32;
const dynamicCache = new Map<string, DynamicCjkFonts>();

let cachedScFont: Buffer | null = null;
const parsedFontCache = new WeakMap<Buffer, opentype.Font>();
let jpChunkPaths: string[] | null = null;
const jpGlyphChunkCache = new Map<string, string | null>();

export type DynamicCjkFonts = {
  primary: Buffer | null;
  extension: Buffer[];
  latin: Buffer[];
};

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
      if (fs.existsSync(p) && name.endsWith('.woff')) return p;
    }
  } catch {
    // ignored
  }
  return null;
}

function locateNotoSansLatinSources(): string[] {
  const candidates = [
    'noto-sans-latin-ext-700-normal.woff',
    'noto-sans-latin-700-normal.woff',
  ];
  try {
    const pkgJsonPath = require_.resolve('@fontsource/noto-sans/package.json');
    const pkgDir = path.join(path.dirname(pkgJsonPath), 'files');
    return candidates
      .map((name) => path.join(pkgDir, name))
      .filter((p) => fs.existsSync(p));
  } catch {
    return [];
  }
}

function locateJpChunkPaths(): string[] {
  if (jpChunkPaths) return jpChunkPaths;
  try {
    const pkgJsonPath = require_.resolve('@fontsource/noto-sans-jp/package.json');
    const pkgDir = path.join(path.dirname(pkgJsonPath), 'files');
    jpChunkPaths = fs
      .readdirSync(pkgDir)
      .filter((name) => /^noto-sans-jp-\d+-700-normal\.woff$/.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((name) => path.join(pkgDir, name));
  } catch {
    jpChunkPaths = [];
  }
  return jpChunkPaths;
}

function parseFont(source: Buffer): opentype.Font | null {
  const cached = parsedFontCache.get(source);
  if (cached) return cached;
  try {
    const font = opentype.parse(Uint8Array.from(source).buffer);
    parsedFontCache.set(source, font);
    return font;
  } catch {
    return null;
  }
}

function loadScFont(): Buffer | null {
  if (cachedScFont) return cachedScFont;
  const sourcePath = locateFullNotoSCBold();
  if (!sourcePath) return null;
  cachedScFont = fs.readFileSync(sourcePath);
  return cachedScFont;
}

function hasGlyph(source: Buffer, ch: string): boolean {
  const font = parseFont(source);
  if (!font) return false;
  return font.charToGlyph(ch).unicode !== undefined;
}

/** Drop codepoints absent from the source font — subset-font emits invalid cmap otherwise. */
function filterSupportedGlyphs(source: Buffer, charset: string): string {
  let out = '';
  for (const ch of charset) {
    if (hasGlyph(source, ch)) out += ch;
  }
  return out;
}

function locateJpChunkForChar(ch: string): string | null {
  if (jpGlyphChunkCache.has(ch)) return jpGlyphChunkCache.get(ch) ?? null;

  for (const chunkPath of locateJpChunkPaths()) {
    const source = fs.readFileSync(chunkPath);
    if (hasGlyph(source, ch)) {
      jpGlyphChunkCache.set(ch, chunkPath);
      return chunkPath;
    }
  }

  jpGlyphChunkCache.set(ch, null);
  return null;
}

function groupExtensionCharsByJpChunk(charset: string): Map<string, string> {
  const byChunk = new Map<string, string>();
  for (const ch of charset) {
    const chunkPath = locateJpChunkForChar(ch);
    if (!chunkPath) continue;
    byChunk.set(chunkPath, (byChunk.get(chunkPath) ?? '') + ch);
  }
  return byChunk;
}

const EMOJI_RE = /\p{Extended_Pictographic}/u;

function isEmojiChar(ch: string): boolean {
  return EMOJI_RE.test(ch);
}

function uniqueSubsetChars(strings: ReadonlyArray<string | null | undefined>): string {
  const set = new Set<string>();
  for (const s of strings) {
    if (!s) continue;
    for (const ch of s) {
      if (isEmojiChar(ch)) continue;
      const cp = ch.codePointAt(0);
      if (cp == null || cp <= 0x7f) continue;
      set.add(ch);
    }
  }
  return [...set].sort().join('');
}

function subtractCharset(charset: string, covered: string): string {
  const coveredSet = new Set(covered);
  return [...charset].filter((ch) => !coveredSet.has(ch)).join('');
}

async function subsetSource(source: Buffer, charset: string): Promise<Buffer> {
  const buf = await subsetFont(source, charset, { targetFormat: 'woff' });
  return Buffer.from(buf);
}

async function buildLatinExtensionSubsets(remainder: string): Promise<Buffer[]> {
  const latin: Buffer[] = [];
  let pending = remainder;

  for (const sourcePath of locateNotoSansLatinSources()) {
    if (!pending) break;
    const source = fs.readFileSync(sourcePath);
    const supported = filterSupportedGlyphs(source, pending);
    if (!supported) continue;
    latin.push(await subsetSource(source, supported));
    pending = subtractCharset(pending, supported);
  }

  return latin;
}

/**
 * Builds dynamic poster font subsets for user-typed names on the canvas.
 */
export async function buildDynamicCjkFonts(
  texts: ReadonlyArray<string | null | undefined>,
): Promise<DynamicCjkFonts> {
  const charset = uniqueSubsetChars(texts);
  if (!charset) return { primary: null, extension: [], latin: [] };

  const cacheKey = createHash('sha1').update(charset).digest('hex');
  const cached = dynamicCache.get(cacheKey);
  if (cached) return cached;

  const scSource = loadScFont();
  let primary: Buffer | null = null;
  const extension: Buffer[] = [];
  let latin: Buffer[] = [];
  let remainder = charset;

  if (scSource) {
    const scSupported = filterSupportedGlyphs(scSource, charset);
    if (scSupported) primary = await subsetSource(scSource, scSupported);
    remainder = subtractCharset(charset, scSupported);

    if (remainder) {
      const byChunk = groupExtensionCharsByJpChunk(remainder);
      let jpCovered = '';
      for (const [chunkPath, chunkChars] of byChunk) {
        const chunkSource = fs.readFileSync(chunkPath);
        const supported = filterSupportedGlyphs(chunkSource, chunkChars);
        if (!supported) continue;
        extension.push(await subsetSource(chunkSource, supported));
        jpCovered += supported;
      }
      remainder = subtractCharset(remainder, jpCovered);
    }
  }

  if (remainder) {
    latin = await buildLatinExtensionSubsets(remainder);
  }

  const out: DynamicCjkFonts = { primary, extension, latin };
  if (primary || extension.length > 0 || latin.length > 0) {
    if (dynamicCache.size >= MAX_CACHE_ENTRIES) {
      const first = dynamicCache.keys().next().value;
      if (first) dynamicCache.delete(first);
    }
    dynamicCache.set(cacheKey, out);
  }
  return out;
}

/** @deprecated Use buildDynamicCjkFonts */
export async function buildDynamicCjkSubset(
  texts: ReadonlyArray<string | null | undefined>,
): Promise<Buffer | null> {
  const { primary } = await buildDynamicCjkFonts(texts);
  return primary;
}

export type PosterCjkSatoriFont = {
  name: string;
  data: Buffer;
  weight: 400 | 700;
  style: 'normal';
};

export function dynamicCjkToSatoriFonts(fonts: DynamicCjkFonts): PosterCjkSatoriFont[] {
  const out: PosterCjkSatoriFont[] = [];
  if (fonts.primary) {
    out.push(
      { name: 'PosterCJK', data: fonts.primary, weight: 400, style: 'normal' },
      { name: 'PosterCJK', data: fonts.primary, weight: 700, style: 'normal' },
    );
  }
  for (const ext of fonts.extension) {
    out.push(
      { name: 'PosterCJKExt', data: ext, weight: 400, style: 'normal' },
      { name: 'PosterCJKExt', data: ext, weight: 700, style: 'normal' },
    );
  }
  for (const ext of fonts.latin) {
    out.push(
      { name: 'PosterLatinExt', data: ext, weight: 400, style: 'normal' },
      { name: 'PosterLatinExt', data: ext, weight: 700, style: 'normal' },
    );
  }
  return out;
}

export function resetPosterDynamicFontCacheForTests(): void {
  dynamicCache.clear();
  cachedScFont = null;
  jpChunkPaths = null;
  jpGlyphChunkCache.clear();
}
