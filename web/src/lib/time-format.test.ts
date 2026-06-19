import { describe, expect, it } from 'vitest';
import { formatMs } from './time-format';

describe('formatMs', () => {
  it('formats mm:ss', () => {
    expect(formatMs(125_000)).toBe('2:05');
  });

  it('never shows negative', () => {
    expect(formatMs(-1000)).toBe('0:00');
  });
});
