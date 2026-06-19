export type TeamOption = { id: string; name: string };

/** Teams eligible for one side — excludes the opponent already picked. */
export function teamOptionsForSide(
  teams: ReadonlyArray<TeamOption>,
  otherTeamId: string,
): TeamOption[] {
  if (!otherTeamId) return [...teams];
  return teams.filter((t) => t.id !== otherTeamId);
}

/** When a pick collides with the other side, return the first alternate id. */
export function resolveOtherTeamId(
  teams: ReadonlyArray<TeamOption>,
  pickedId: string,
  currentOtherId: string,
): string {
  if (pickedId !== currentOtherId) return currentOtherId;
  return teams.find((t) => t.id !== pickedId)?.id ?? currentOtherId;
}

export function canCreateGame(
  teamAId: string,
  teamBId: string,
  teamCount: number,
): boolean {
  return teamCount >= 2 && Boolean(teamAId) && Boolean(teamBId) && teamAId !== teamBId;
}
