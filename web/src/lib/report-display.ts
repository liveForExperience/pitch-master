export type MatchResult = 'A_WIN' | 'B_WIN' | 'DRAW' | 'PENDING';

export function getMatchResult(
  scoreA: number,
  scoreB: number,
  status: string,
): MatchResult {
  if (status !== 'FINISHED') return 'PENDING';
  if (scoreA > scoreB) return 'A_WIN';
  if (scoreA < scoreB) return 'B_WIN';
  return 'DRAW';
}

export function matchResultLabel(result: MatchResult, teamName?: string): string {
  switch (result) {
    case 'A_WIN':
      return teamName ? `${teamName} 胜` : 'A 队胜';
    case 'B_WIN':
      return teamName ? `${teamName} 胜` : 'B 队胜';
    case 'DRAW':
      return '平局';
    default:
      return '未结束';
  }
}

export function gameStatusLabel(status: string): string {
  switch (status) {
    case 'READY':
      return '待开始';
    case 'PLAYING':
      return '进行中';
    case 'PAUSED':
      return '暂停';
    case 'FINISHED':
      return '已结束';
    default:
      return status;
  }
}
