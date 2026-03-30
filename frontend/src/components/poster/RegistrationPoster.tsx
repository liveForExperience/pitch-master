import React from 'react';
import { Clock, MapPin, Users } from 'lucide-react';

interface RegistrationPosterProps {
  posterRef: React.RefObject<HTMLDivElement>;
  match: any;
  posterDate: { full: string };
  registeredCount: number;
  totalCapacity: number;
}

const RegistrationPoster: React.FC<RegistrationPosterProps> = ({
  posterRef, match, posterDate, registeredCount, totalCapacity
}) => {
  return (
    <div className="fixed -left-[9999px] top-0">
      <div
        ref={posterRef}
        className="w-[375px] bg-neutral-950 text-white font-sans relative overflow-hidden"
      >
        {/* Decorative bg */}
        <div className="absolute top-0 right-0 opacity-[0.06] text-[100px] font-black italic select-none pointer-events-none leading-none pr-4 pt-6">
          OLDBOY
        </div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-neutral-950 to-transparent" />

        <div className="relative z-10 p-8 pb-6">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold tracking-[0.1em] text-primary uppercase mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {match?.tournamentName || '默认周赛'}
            </div>
            <h1 className="text-[28px] font-black leading-tight tracking-tight mb-3">{match?.title}</h1>
            <div className="h-[2px] w-16 bg-primary/70 mb-4" />
            <div className="space-y-2 text-[13px] text-neutral-300">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-primary shrink-0" />
                <span>{posterDate.full}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-primary shrink-0" />
                <span>{match?.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={13} className="text-primary shrink-0" />
                <span>{match?.numGroups}组 · 每组{match?.playersPerGroup}人 · {match?.plannedGameCount}场</span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-center">
              <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">已报名</div>
              <div className="text-xl font-black text-primary">{registeredCount}</div>
              {totalCapacity > 0 && (
                <div className="text-[10px] font-medium text-neutral-600">/ {totalCapacity} 人</div>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-center">
              <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">比赛规模</div>
              <div className="text-xl font-black text-white">{match?.plannedGameCount || '-'}</div>
              <div className="text-[10px] font-medium text-neutral-600">场</div>
            </div>
          </div>

          {/* Footer branding */}
          <div className="pt-5 border-t border-neutral-800 flex justify-between items-end">
            <div>
              <div className="text-[9px] text-neutral-600 font-bold mb-1 uppercase tracking-widest">Powered by</div>
              <div className="text-lg font-black italic tracking-tighter">
                OLDBOY <span className="text-primary">CLUB</span>
              </div>
            </div>
            <div className="text-right">
              <div className="rounded-lg bg-primary/15 border border-primary/25 px-3 py-1.5 text-[10px] font-black text-primary tracking-wide">
                扫码报名
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPoster;
