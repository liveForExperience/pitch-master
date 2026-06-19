import { describe, expect, it } from 'vitest';
import { buildTimerState, deriveElapsedMs, deriveRemainingMs } from '../src/services/timer.service.js';

const base = {
  status: 'PLAYING' as const,
  startedAt: 1_000_000,
  finishedAt: null as number | null,
  pausedDurationMs: 0,
  pauseStartedAt: null as number | null,
  plannedDurationMs: 30 * 60 * 1000,
};

describe('timer.service', () => {
  it('returns 0 elapsed before start', () => {
    expect(deriveElapsedMs({ ...base, startedAt: null, status: 'READY' }, 2_000_000)).toBe(0);
  });

  it('computes elapsed while playing', () => {
    expect(deriveElapsedMs(base, 1_000_000 + 90_000)).toBe(90_000);
  });

  it('adds active pause duration', () => {
    const elapsed = deriveElapsedMs(
      { ...base, status: 'PAUSED', pauseStartedAt: 1_050_000, pausedDurationMs: 10_000 },
      1_070_000,
    );
    expect(elapsed).toBe(40_000);
  });

  it('computes remaining time', () => {
    expect(deriveRemainingMs(base, 1_000_000 + 60_000)).toBe(30 * 60 * 1000 - 60_000);
  });

  it('buildTimerState bundles fields', () => {
    const state = buildTimerState(base, 1_000_000 + 120_000);
    expect(state.status).toBe('PLAYING');
    expect(state.elapsedMs).toBe(120_000);
    expect(state.remainingMs).toBe(30 * 60 * 1000 - 120_000);
  });

  it('freezes elapsed when finished', () => {
    const finished = {
      ...base,
      status: 'FINISHED' as const,
      finishedAt: 1_000_000 + 600_000,
      pausedDurationMs: 0,
      pauseStartedAt: null,
    };
    expect(deriveElapsedMs(finished, 1_000_000 + 999_000)).toBe(600_000);
    expect(deriveRemainingMs(finished, 1_000_000 + 999_000)).toBe(30 * 60 * 1000 - 600_000);
  });
});
