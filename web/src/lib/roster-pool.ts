import type { Team } from '../api/types';

/** After removing a player, return their name to the import pool when safe. */
export function nameReturnsToPool(
  name: string,
  teams: ReadonlyArray<Team>,
  removedFromTeamId: string,
): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const onOtherTeam = teams.some(
    (team) =>
      team.id !== removedFromTeamId && team.roster.some((player) => player.name === trimmed),
  );
  return !onOtherTeam;
}

export function mergeIntoPool(pool: string[], name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed || pool.includes(trimmed)) return pool;
  return [...pool, trimmed];
}
