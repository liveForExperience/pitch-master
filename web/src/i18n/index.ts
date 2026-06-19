import { useSyncExternalStore } from 'react';
import { dicts, en, zh } from './dict';

export type Locale = 'zh' | 'en';

const STORAGE_KEY = 'pm:locale';
const listeners = new Set<() => void>();
let current: Locale = detectLocale();

if (typeof document !== 'undefined') {
  document.documentElement.lang = current === 'zh' ? 'zh-CN' : 'en';
}

function detectLocale(): Locale {
  try {
    const saved =
      typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    /* ignore */
  }
  if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
    if (navigator.language.toLowerCase().startsWith('zh')) return 'zh';
  }
  return 'en';
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  if (locale === current) return;
  current = locale;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, locale);
    }
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  }
  listeners.forEach((fn) => fn());
}

type TParams = Record<string, string | number>;

/**
 * Translate a key. Missing keys fall back to English, then to the key string
 * itself (so a typo is visible in the UI rather than rendering blank).
 */
export function translate(
  locale: Locale,
  key: string,
  params?: TParams,
): string {
  const raw = dicts[locale][key] ?? en[key] ?? zh[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] === undefined ? '' : String(params[k]),
  );
}

export function t(key: string, params?: TParams): string {
  return translate(current, key, params);
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getLocale, getLocale);
}

/**
 * Returns a `t` function bound to the current locale. Components that call
 * `useT()` re-render automatically when the user switches language.
 */
export function useT(): (key: string, params?: TParams) => string {
  const locale = useLocale();
  return (key, params) => translate(locale, key, params);
}

/** Test-only reset (does not persist). */
export function __resetLocaleForTests(locale: Locale): void {
  current = locale;
  listeners.forEach((fn) => fn());
}
