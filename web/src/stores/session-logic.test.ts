import { describe, expect, it } from 'vitest';
import {
  ACTIVE_LIMIT,
  ARCHIVED_LIMIT,
  archiveRecentEvent,
  rememberRecentEvent,
  removeStoredEvent,
  findStoredEventByShortCode,
  type RecentEvent,
} from './session-logic';

const evt = (shortCode: string, name: string): RecentEvent => ({
  id: `id-${shortCode}`,
  shortCode,
  name,
  pin: '123456',
  createdAt: 1000,
  visitedAt: 2000,
});

describe('session-logic', () => {
  it('rememberRecentEvent prepends and dedupes by shortCode', () => {
    const list = [evt('AAA', 'A'), evt('BBB', 'B')];
    const next = rememberRecentEvent(
      list,
      { id: 'id-AAA', shortCode: 'AAA', name: 'A2', pin: '111111', createdAt: 1000 },
      3000,
    );
    expect(next).toHaveLength(2);
    expect(next[0]!.name).toBe('A2');
    expect(next[0]!.visitedAt).toBe(3000);
  });

  it('rememberRecentEvent caps active list at ACTIVE_LIMIT', () => {
    let list: RecentEvent[] = [];
    for (let i = 0; i < ACTIVE_LIMIT + 2; i++) {
      list = rememberRecentEvent(list, evt(`C${i}`, `Event ${i}`), 1000 + i);
    }
    expect(list).toHaveLength(ACTIVE_LIMIT);
    expect(list[0]!.shortCode).toBe(`C${ACTIVE_LIMIT + 1}`);
  });

  it('archiveRecentEvent moves item from active to archived', () => {
    const active = [evt('AAA', 'A'), evt('BBB', 'B')];
    const archived = [evt('OLD', 'Old')];
    const next = archiveRecentEvent(active, archived, 'BBB');
    expect(next!.recentEvents.map((e) => e.shortCode)).toEqual(['AAA']);
    expect(next!.archivedEvents[0]!.shortCode).toBe('BBB');
    expect(next!.archivedEvents[1]!.shortCode).toBe('OLD');
  });

  it('archiveRecentEvent returns null when shortCode not in active list', () => {
    expect(archiveRecentEvent([evt('AAA', 'A')], [], 'ZZZ')).toBeNull();
  });

  it('removeStoredEvent clears from both lists', () => {
    const next = removeStoredEvent([evt('AAA', 'A')], [evt('BBB', 'B')], 'BBB');
    expect(next.recentEvents).toHaveLength(1);
    expect(next.archivedEvents).toHaveLength(0);
  });

  it('findStoredEventByShortCode is case-insensitive on shortCode', () => {
    const active = [evt('ABC123', 'Test')];
    expect(findStoredEventByShortCode(active, [], 'abc123')?.name).toBe('Test');
  });

  it('archived list respects ARCHIVED_LIMIT', () => {
    let active = [evt('NEW', 'New')];
    let archived: RecentEvent[] = [];
    for (let i = 0; i < ARCHIVED_LIMIT + 3; i++) {
      const code = `X${i}`;
      active = [evt(code, `E${i}`), ...active];
      const moved = archiveRecentEvent(active, archived, code);
      if (moved) {
        active = moved.recentEvents;
        archived = moved.archivedEvents;
      }
    }
    expect(archived.length).toBeLessThanOrEqual(ARCHIVED_LIMIT);
  });
});
