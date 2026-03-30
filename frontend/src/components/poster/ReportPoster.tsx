import React from 'react';
import { Trophy, Flame, Target } from 'lucide-react';

interface ReportPosterProps {
  posterRef: React.RefObject<HTMLDivElement>;
  match: any;
  posterDate: { full: string; short: string };
  games: any[];
  teamNames: Record<number, string>;
  standings: any;
  stats: any;
  groupsData: any;
}

const GROUP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const ReportPoster: React.FC<ReportPosterProps> = ({
  posterRef, match, posterDate, games, teamNames, standings, stats, groupsData
}) => {
  const getTeamLabel = (idx: number) => teamNames?.[idx] || `Team ${GROUP_LABELS[idx] ?? idx + 1}`;

  // Find champion
  const championTeamIndex = standings?.standings?.[0]?.teamIndex;
  const championPlayers = championTeamIndex !== undefined ? groupsData?.groups?.[championTeamIndex] : [];
  const championTeamName = championTeamIndex !== undefined ? getTeamLabel(championTeamIndex) : '';

  return (
    <div className="fixed -left-[9999px] top-0">
      <div 
        ref={posterRef}
        className="w-[375px] bg-neutral-950 p-6 pt-8 text-white font-sans relative overflow-hidden flex flex-col gap-5"
      >
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 opacity-[0.05] text-[80px] leading-none pr-4 pt-6 font-black italic select-none pointer-events-none">
          REPORT
        </div>

        {/* Header */}
        <div className="relative z-10 flex flex-col gap-2 mb-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold tracking-[0.1em] text-primary uppercase self-start">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Match Report
          </div>
          <h1 className="text-[26px] font-black leading-tight tracking-tight mt-1">{match?.title}</h1>
          <div className="text-xs text-neutral-400 font-semibold">{posterDate.full} @ {match?.location}</div>
        </div>

        {/* 冠军荣耀 */}
        {championPlayers && championPlayers.length > 0 && (
          <div className="relative z-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 p-4">
            <div className="flex items-center justify-between mb-3 border-b border-amber-500/20 pb-2">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-amber-400" />
                <span className="text-xs font-black text-amber-400 tracking-widest uppercase">Champion队伍</span>
              </div>
              <div className="text-sm font-black text-white italic">{championTeamName}</div>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {championPlayers.map((p: any) => (
                <div key={p.id} className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full pl-2 pr-2.5 py-1">
                  <div className="flex items-center justify-center text-[10px] font-black text-amber-400 shrink-0">
                    {(p.name || '?')[0]}
                  </div>
                  <span className="text-[11px] font-bold text-amber-50 pb-[2px] leading-tight">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 赛况比分 (前4场或全部) */}
        {games && games.length > 0 && (
          <div className="relative z-10">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Flame size={12} className="text-primary" /> 赛况记录
            </div>
            <div className="grid grid-cols-2 gap-2">
              {games.slice(0, 6).map((g: any, idx: number) => (
                <div key={g.id} className="bg-white/[0.04] border border-white/10 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1">
                  <span className="text-[9px] text-neutral-500 font-bold uppercase">Match {idx + 1}</span>
                  <div className="flex items-center justify-center gap-2 w-full">
                    <span className="text-xs font-bold text-white truncate max-w-[48px] text-right pb-[2px] leading-normal">{getTeamLabel(g.teamAIndex)}</span>
                    <span className="text-[13px] font-black text-primary px-1">{g.scoreA}:{g.scoreB}</span>
                    <span className="text-xs font-bold text-white truncate max-w-[48px] text-left pb-[2px] leading-normal">{getTeamLabel(g.teamBIndex)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 积分榜 (简化版) */}
        {standings && standings.standings && (
          <div className="relative z-10">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              积分榜 Standings
            </div>
            <div className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[2rem_1fr_2rem_2rem] gap-1 px-3 py-2 text-[9px] font-bold text-neutral-500 border-b border-white/5 bg-white/[0.02]">
                <span>排名</span>
                <span>队伍</span>
                <span className="text-center">净胜</span>
                <span className="text-center">积分</span>
              </div>
              {standings.standings.slice(0, 4).map((row: any, i: number) => (
                <div key={row.teamIndex} className={`grid grid-cols-[2rem_1fr_2rem_2rem] items-center gap-1 px-3 py-2 text-[11px] ${i < 3 ? 'border-b border-white/[0.04]' : ''}`}>
                  <span className={`font-black ${i === 0 ? 'text-amber-400' : 'text-neutral-400'}`}>{row.rank}</span>
                  <span className="font-bold text-white truncate pb-[2px] leading-normal">{row.teamName}</span>
                  <span className="text-center text-neutral-400">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</span>
                  <span className="text-center font-black text-primary">{row.points}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 射手 / 助攻榜并排 */}
        {stats && (
          <div className="relative z-10 grid grid-cols-2 gap-3 pb-2">
            {/* 射手榜 */}
            {stats.topScorers && stats.topScorers.length > 0 && (
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                <div className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Target size={12} /> 射手榜
                </div>
                <div className="flex flex-col gap-1.5">
                  {stats.topScorers.slice(0, 3).map((p: any, i: number) => (
                    <div key={p.playerId} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.04] rounded-full pl-3 pr-3 py-1">
                      <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
                        <div className={`flex items-center justify-center text-[10px] shrink-0 ${i === 0 ? 'text-amber-400 font-black' : 'text-neutral-400 font-bold'}`}>
                          {i + 1}
                        </div>
                        <span className="text-[11px] font-bold text-white/90 whitespace-nowrap overflow-hidden text-ellipsis py-0.5 leading-tight flex-1">{p.playerName}</span>
                      </div>
                      <span className="text-[10px] font-black text-sky-400 shrink-0 ml-2">{p.goals}球</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* 助攻榜 */}
            {stats.topAssisters && stats.topAssisters.length > 0 && (
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Target size={12} /> 助攻榜
                </div>
                <div className="flex flex-col gap-1.5">
                  {stats.topAssisters.slice(0, 3).map((p: any, i: number) => (
                    <div key={p.playerId} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.04] rounded-full pl-3 pr-3 py-1">
                      <div className="flex items-center gap-1.5 overflow-hidden flex-1 min-w-0">
                        <div className={`flex items-center justify-center text-[10px] shrink-0 ${i === 0 ? 'text-amber-400 font-black' : 'text-neutral-400 font-bold'}`}>
                          {i + 1}
                        </div>
                        <span className="text-[11px] font-bold text-white/90 whitespace-nowrap overflow-hidden text-ellipsis py-0.5 leading-tight flex-1">{p.playerName}</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 shrink-0 ml-2">{p.assists}次</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer branding */}
        <div className="pt-3 border-t border-neutral-800 flex items-end relative z-10 mt-auto">
          <div>
            <div className="text-[9px] text-neutral-600 font-bold mb-1 uppercase tracking-widest">Powered by</div>
            <div className="text-[13px] font-black italic tracking-tighter">
              OLDBOY <span className="text-primary">CLUB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPoster;
