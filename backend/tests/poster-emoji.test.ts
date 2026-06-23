import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  emojiToTwemojiSlug,
  loadAdditionalPosterAsset,
  loadEmojiSvg,
  resetPosterEmojiCacheForTests,
} from '../src/services/poster-emoji.js';

describe('poster-emoji', () => {
  afterEach(() => {
    resetPosterEmojiCacheForTests();
    vi.restoreAllMocks();
  });

  it('converts emoji to twemoji slug', () => {
    expect(emojiToTwemojiSlug('🎉')).toBe('1f389');
    expect(emojiToTwemojiSlug('⚽')).toBe('26bd');
  });

  it('loads emoji SVG from CDN and caches it', async () => {
    const raw = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"></svg>';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => raw,
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = await loadEmojiSvg('🎉');
    const second = await loadEmojiSvg('🎉');

    expect(first?.startsWith('data:image/svg+xml;base64,')).toBe(true);
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain('1f389.svg');
  });

  it('loadAdditionalPosterAsset returns SVG for emoji segments', async () => {
    const raw = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"></svg>';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => raw,
      }),
    );

    const result = await loadAdditionalPosterAsset('emoji', '🎉');
    expect(result.startsWith('data:image/svg+xml;base64,')).toBe(true);
  });

  it('loadAdditionalPosterAsset returns PosterCJK fonts for missing CJK glyphs', async () => {
    const fonts = await loadAdditionalPosterAsset('ja-JP|zh-CN|zh-TW|zh-HK', '𠮷');
    expect(Array.isArray(fonts)).toBe(true);
    expect((fonts as { name: string }[]).some((f) => f.name === 'PosterCJKExt')).toBe(true);
  });
});
