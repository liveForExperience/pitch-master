import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearRosterImportPool,
  loadRosterImportPool,
  saveRosterImportPool,
} from './roster-import-store';

describe('roster-import-store', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns empty pool when nothing saved', () => {
    expect(loadRosterImportPool('evt-1')).toEqual([]);
  });

  it('round-trips names per event id', () => {
    saveRosterImportPool('evt-1', ['张三', '李四']);
    expect(loadRosterImportPool('evt-1')).toEqual(['张三', '李四']);
    expect(loadRosterImportPool('evt-2')).toEqual([]);
  });

  it('removes storage key when pool is cleared or saved empty', () => {
    saveRosterImportPool('evt-1', ['张三']);
    clearRosterImportPool('evt-1');
    expect(loadRosterImportPool('evt-1')).toEqual([]);

    saveRosterImportPool('evt-1', ['李四']);
    saveRosterImportPool('evt-1', []);
    expect(loadRosterImportPool('evt-1')).toEqual([]);
  });

  it('ignores corrupt JSON and non-string entries', () => {
    store.set('pm:roster-import:evt-bad', '{not json');
    expect(loadRosterImportPool('evt-bad')).toEqual([]);

    store.set('pm:roster-import:evt-mixed', JSON.stringify(['ok', 1, '  ']));
    expect(loadRosterImportPool('evt-mixed')).toEqual(['ok']);
  });

  it('no-ops when eventId is empty', () => {
    saveRosterImportPool('', ['张三']);
    clearRosterImportPool('');
    expect(loadRosterImportPool('')).toEqual([]);
  });
});
