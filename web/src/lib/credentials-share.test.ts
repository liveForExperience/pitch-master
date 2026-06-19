import { describe, expect, it } from 'vitest';
import { buildCredentialsShareText, eventWatchPath } from './credentials-share';

describe('credentials-share', () => {
  it('builds a concise share text with title+name, sections and watch url', () => {
    const text = buildCredentialsShareText(
      {
        shortCode: 'hc55az',
        pin: '713734',
        eventName: '周二夜踢',
        origin: 'https://soccer.example.com',
      },
      (key, params) => {
        if (key === 'cred.shareText.titleWithName') return `【PM】${params?.name}`;
        if (key === 'cred.shareText.codeLine') return `分享码：${params?.code}`;
        if (key === 'cred.shareText.pinLine') return `PIN：${params?.pin}`;
        return key;
      },
    );

    expect(text).toContain('【PM】周二夜踢');
    expect(text).toContain('cred.shareText.viewerSection');
    expect(text).toContain('分享码：HC55AZ');
    expect(text).toContain('https://soccer.example.com/events/HC55AZ');
    expect(text).toContain('cred.shareText.adminSection');
    expect(text).toContain('PIN：713734');

    // Viewer block appears before admin block so the warning context lands
    // after the safe-to-share part.
    const viewerIdx = text.indexOf('cred.shareText.viewerSection');
    const adminIdx = text.indexOf('cred.shareText.adminSection');
    expect(viewerIdx).toBeGreaterThan(-1);
    expect(adminIdx).toBeGreaterThan(viewerIdx);

    // Should be short — under ~12 lines total after trimming blanks.
    const nonEmpty = text.split('\n').filter((l) => l.trim().length > 0);
    expect(nonEmpty.length).toBeLessThanOrEqual(8);
  });

  it('falls back to plain title when event name missing', () => {
    const text = buildCredentialsShareText(
      { shortCode: 'ab12cd', pin: '111111', origin: 'https://x.example.com' },
      (key) => key,
    );
    expect(text.startsWith('cred.shareText.title\n')).toBe(true);
    expect(text).not.toContain('cred.shareText.titleWithName');
  });

  it('normalizes watch path', () => {
    expect(eventWatchPath('ab12cd')).toBe('/events/AB12CD');
  });
});
