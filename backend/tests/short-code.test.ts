import { describe, expect, it } from 'vitest';
import { normalizeShortCode } from '../src/lib/short-code.js';

describe('normalizeShortCode', () => {
  it('trims and uppercases', () => {
    expect(normalizeShortCode(' abc123 ')).toBe('ABC123');
  });
});
