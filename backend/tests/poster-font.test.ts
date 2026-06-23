import { describe, expect, it } from 'vitest';
import { buildDynamicCjkFonts } from '../src/services/poster-font.js';

describe('poster-font', () => {
  it('builds a dynamic subset for punctuation and common CJK chars', async () => {
    const fonts = await buildDynamicCjkFonts(['《周末赛》太郎']);
    expect(fonts.primary).not.toBeNull();
    expect(fonts.primary!.byteLength).toBeGreaterThan(500);
    expect(fonts.extension).toHaveLength(0);
    expect(fonts.latin).toHaveLength(0);
  });

  it('builds JP extension subset for glyphs missing from Noto SC', async () => {
    const fonts = await buildDynamicCjkFonts(['𠮷野家']);
    expect(fonts.extension.length).toBeGreaterThan(0);
    expect(fonts.extension[0]!.byteLength).toBeGreaterThan(200);
  });

  it('builds latin extension subset for diacritic Latin names', async () => {
    const fonts = await buildDynamicCjkFonts(['mórş ýøųñġ']);
    expect(fonts.latin.length).toBeGreaterThan(0);
    expect(fonts.latin[0]!.byteLength).toBeGreaterThan(200);
  });

  it('skips emoji-only strings for dynamic subset', async () => {
    const fonts = await buildDynamicCjkFonts(['🎉⚽']);
    expect(fonts.primary).toBeNull();
    expect(fonts.extension).toHaveLength(0);
    expect(fonts.latin).toHaveLength(0);
  });
});
