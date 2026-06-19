import { describe, expect, it } from 'vitest';
import { buildCredentialsShareText, eventWatchPath } from './credentials-share';

describe('credentials-share', () => {
  it('builds structured share text with event name and watch url', () => {
    const text = buildCredentialsShareText(
      {
        shortCode: 'hc55az',
        pin: '713734',
        eventName: '周二夜踢',
        origin: 'https://soccer.example.com',
      },
      (key, params) => {
        if (key === 'cred.shareText.event') return `活动：${params?.name}`;
        if (key === 'cred.shareText.codeLine') return `分享码：${params?.code}`;
        if (key === 'cred.shareText.pinLine') return `PIN：${params?.pin}`;
        return key;
      },
    );

    expect(text).toContain('cred.shareText.title');
    expect(text).toContain('活动：周二夜踢');
    expect(text).toContain('分享码：HC55AZ');
    expect(text).toContain('PIN：713734');
    expect(text).toContain('https://soccer.example.com/events/HC55AZ');
  });

  it('normalizes watch path', () => {
    expect(eventWatchPath('ab12cd')).toBe('/events/AB12CD');
  });
});
