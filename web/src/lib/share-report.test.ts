import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  buildEventShareText,
  buildGameShareText,
  copyToClipboard,
  eventReportPath,
  gameReportPath,
  reportPageUrl,
} from './share-report';
import { __resetLocaleForTests } from '../i18n';

describe('share-report', () => {
  beforeAll(() => __resetLocaleForTests('zh'));

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

  describe('copyToClipboard', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('uses navigator.clipboard when available', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', { clipboard: { writeText } });

      await copyToClipboard('hello');

      expect(writeText).toHaveBeenCalledWith('hello');
    });

    it('falls back to execCommand when clipboard API is missing', async () => {
      vi.stubGlobal('navigator', {});
      const execCommand = vi.fn().mockReturnValue(true);
      const textarea = {
        value: '',
        style: {} as CSSStyleDeclaration,
        setAttribute: vi.fn(),
        select: vi.fn(),
        setSelectionRange: vi.fn(),
      };
      const body = { appendChild: vi.fn(), removeChild: vi.fn() };
      vi.stubGlobal('document', {
        body,
        createElement: vi.fn(() => textarea),
        execCommand,
      });

      await copyToClipboard('hello');

      expect(textarea.value).toBe('hello');
      expect(execCommand).toHaveBeenCalledWith('copy');
      expect(body.appendChild).toHaveBeenCalledWith(textarea);
      expect(body.removeChild).toHaveBeenCalledWith(textarea);
    });

    it('falls back to execCommand when clipboard writeText rejects', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
      vi.stubGlobal('navigator', { clipboard: { writeText } });
      const execCommand = vi.fn().mockReturnValue(true);
      vi.stubGlobal('document', {
        body: { appendChild: vi.fn(), removeChild: vi.fn() },
        createElement: vi.fn(() => ({
          value: '',
          style: {},
          setAttribute: vi.fn(),
          select: vi.fn(),
          setSelectionRange: vi.fn(),
        })),
        execCommand,
      });

      await copyToClipboard('hello');

      expect(writeText).toHaveBeenCalledWith('hello');
      expect(execCommand).toHaveBeenCalledWith('copy');
    });

    it('throws when all copy strategies fail', async () => {
      vi.stubGlobal('navigator', {});
      vi.stubGlobal('document', {
        body: { appendChild: vi.fn(), removeChild: vi.fn() },
        createElement: vi.fn(() => ({
          value: '',
          style: {},
          setAttribute: vi.fn(),
          select: vi.fn(),
          setSelectionRange: vi.fn(),
        })),
        execCommand: vi.fn().mockReturnValue(false),
      });

      await expect(copyToClipboard('hello')).rejects.toThrow('当前环境无法复制到剪贴板');
    });
  });
});
