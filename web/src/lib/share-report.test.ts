import { describe, expect, it } from 'vitest';
import {
  buildEventShareText,
  buildGameShareText,
  eventReportPath,
  gameReportPath,
  reportPageUrl,
} from './share-report';

describe('share-report', () => {
  it('builds share copy', () => {
    expect(buildEventShareText('周末局', 'ABC123')).toBe('周末局 活动战报 · 分享码 ABC123');
    expect(buildGameShareText('红队', '蓝队', 2, 1)).toBe('红队 2:1 蓝队 · 单场战报');
  });

  it('builds report paths', () => {
    expect(eventReportPath('abc')).toBe('/events/abc/report');
    expect(gameReportPath('g1')).toBe('/games/g1/report');
  });

  it('reportPageUrl joins origin', () => {
    expect(reportPageUrl('/events/x/report', 'https://soccer.example.com')).toBe(
      'https://soccer.example.com/events/x/report',
    );
  });
});
