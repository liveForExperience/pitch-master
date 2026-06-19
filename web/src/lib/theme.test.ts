import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('theme store', () => {
  const store = new Map<string, string>();
  const classList = new Set<string>();
  const classProxy = {
    add: (c: string) => classList.add(c),
    remove: (c: string) => classList.delete(c),
    contains: (c: string) => classList.has(c),
    toggle: (c: string, force?: boolean) => {
      if (force === undefined) {
        if (classList.has(c)) classList.delete(c);
        else classList.add(c);
        return classList.has(c);
      }
      if (force) classList.add(c);
      else classList.delete(c);
      return force;
    },
  };

  beforeEach(async () => {
    store.clear();
    classList.clear();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
    vi.stubGlobal('document', {
      documentElement: { classList: classProxy },
    });
    // Re-import after globals are stubbed so the module picks up our document.
    vi.resetModules();
    const mod = await import('./theme');
    mod.__resetThemeForTests('light');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts in light and adds no .dark class', async () => {
    const { getTheme } = await import('./theme');
    expect(getTheme()).toBe('light');
    expect(classList.has('dark')).toBe(false);
  });

  it('toggleTheme flips and applies .dark class', async () => {
    const { toggleTheme, getTheme } = await import('./theme');
    expect(toggleTheme()).toBe('dark');
    expect(getTheme()).toBe('dark');
    expect(classList.has('dark')).toBe(true);
    expect(toggleTheme()).toBe('light');
    expect(classList.has('dark')).toBe(false);
  });

  it('persists explicit setTheme to localStorage', async () => {
    const { setTheme } = await import('./theme');
    setTheme('dark');
    expect(store.get('pm:theme')).toBe('dark');
    setTheme('light');
    expect(store.get('pm:theme')).toBe('light');
  });

  it('setTheme is a no-op when value unchanged', async () => {
    const { setTheme } = await import('./theme');
    setTheme('light');
    expect(store.has('pm:theme')).toBe(false);
  });
});
