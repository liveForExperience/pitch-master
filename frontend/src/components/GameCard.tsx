import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { MatchGame } from '../api/match';
import { ChevronRight } from 'lucide-react';

const teamName = (index: number, teamNames?: Record<number, string>) =>
  teamNames?.[index] ?? `队伍 ${String.fromCharCode(65 + index)}`;

interface GameCardProps {
  game: MatchGame;
  tNames: Record<number, string>;
  matchId: string;
}

const GameCard: React.FC<GameCardProps> = ({ game, tNames, matchId }) => {
  const navigate = useNavigate();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const nameA = teamName(game.teamAIndex, tNames);
  const nameB = teamName(game.teamBIndex, tNames);
  const scoreA = game.scoreA ?? 0;
  const scoreB = game.scoreB ?? 0;
  const isPlaying = game.status === 'PLAYING';
  const isFinished = game.status === 'FINISHED';

  return (
    <div
      onClick={() => navigate(`/tournaments/${tournamentId}/matches/${matchId}/games/${game.id}`)}
      className={`group relative overflow-hidden rounded-[1.25rem] border pl-5 pr-10 py-5 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)] active:scale-[0.98] active:shadow-sm ${isPlaying
          ? 'border-orange-400/40 dark:border-orange-500/30 bg-orange-50/80 dark:bg-[linear-gradient(135deg,rgba(234,88,12,0.08),rgba(10,10,10,1))] hover:border-orange-500/60 dark:hover:border-orange-500/50'
          : isFinished
            ? 'border-gray-200 dark:border-white/6 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/20 hover:shadow-gray-100 dark:hover:shadow-primary/5'
            : 'border-gray-200 dark:border-white/6 bg-gray-50/80 dark:bg-[rgba(255,255,255,0.015)] hover:border-gray-300 dark:hover:border-white/20'
        }`}
    >
      {/* Dynamic Sweep Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-[150%] skew-x-[-30deg] group-hover:translate-x-[150%] transition-transform duration-[1.2s] ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none" />

      {/* Decorative Blur Bubble */}
      <div className={`absolute -bottom-8 -right-8 h-24 w-24 rounded-full blur-[40px] transition-all duration-700 pointer-events-none opacity-0 group-hover:opacity-10 dark:group-hover:opacity-40 ${isPlaying ? 'bg-orange-500' : 'bg-primary'
        }`} />

      {isPlaying && (
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-orange-500/15 px-2 py-1 text-[9px] font-black text-orange-600 dark:text-orange-400 backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
          LIVE
        </div>
      )}

      {/* Content wrapper */}
      <div className="relative z-10 flex items-center justify-between gap-4">

        {/* Team A */}
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <div className="truncate text-sm font-bold tracking-tight text-gray-800 dark:text-white/80 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
            {nameA}
          </div>
          {game.status !== 'READY' && (
            <div className={`text-3xl font-black leading-none tracking-tighter transition-colors duration-300 ${isPlaying
                ? 'text-gray-900 dark:text-white'
                : isFinished && scoreA > scoreB
                  ? 'text-primary'
                  : 'text-gray-400 dark:text-neutral-500 group-hover:text-gray-600 dark:group-hover:text-neutral-300'
              }`}>
              {scoreA}
            </div>
          )}
        </div>

        {/* Divider / Info */}
        <div className="flex flex-col items-center px-1 shrink-0">
          {game.status === 'READY' ? (
            <span className="text-[10px] font-bold tracking-widest text-gray-400 dark:text-neutral-600 group-hover:text-gray-600 dark:group-hover:text-neutral-400 transition-colors duration-300">VS</span>
          ) : (
            <span className="text-lg font-black text-gray-400 dark:text-neutral-700 transition-colors duration-300 group-hover:text-gray-500 dark:group-hover:text-neutral-500">:</span>
          )}

          {isFinished && (
            <span className="mt-1.5 text-[9px] font-black tracking-widest text-gray-400 dark:text-neutral-600 transition-colors duration-300 group-hover:text-gray-500 dark:group-hover:text-neutral-400">FT</span>
          )}
          {game.status === 'READY' && game.startTime && (
            <span className="mt-1.5 text-[9px] font-semibold text-gray-400 dark:text-neutral-600 tracking-wide transition-colors duration-300 group-hover:text-gray-500 dark:group-hover:text-neutral-400">
              {dayjs(game.startTime).format('HH:mm')}
            </span>
          )}
        </div>

        {/* Team B */}
        <div className="flex min-w-0 flex-1 flex-col items-end gap-1">
          <div className="truncate text-sm font-bold tracking-tight text-gray-800 dark:text-white/80 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
            {nameB}
          </div>
          {game.status !== 'READY' && (
            <div className={`text-3xl font-black leading-none tracking-tighter transition-colors duration-300 ${isPlaying
                ? 'text-gray-900 dark:text-white'
                : isFinished && scoreB > scoreA
                  ? 'text-primary'
                  : 'text-gray-400 dark:text-neutral-500 group-hover:text-gray-600 dark:group-hover:text-neutral-300'
              }`}>
              {scoreB}
            </div>
          )}
        </div>
      </div>

      {/* Hover Arrow Indicator */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center -translate-x-3 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out text-primary/70 pointer-events-none">
        <ChevronRight size={18} />
      </div>

    </div>
  );
};

export default GameCard;
