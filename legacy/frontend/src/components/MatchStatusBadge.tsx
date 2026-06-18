import React from 'react';
import { getMatchStatusMeta } from '../constants/match';

interface MatchStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const MatchStatusBadge: React.FC<MatchStatusBadgeProps> = ({ status, size = 'md' }) => {
  const meta = getMatchStatusMeta(status);
  const isOngoing = status === 'ONGOING';

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-[0.06em] ${meta.badgeClass}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass} ${isOngoing ? 'animate-pulse' : ''}`} />
        {meta.label}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] backdrop-blur-sm ${meta.badgeClass}`}>
      <span className={`h-2 w-2 rounded-full ${meta.dotClass} ${isOngoing ? 'animate-pulse' : ''}`} />
      {meta.label}
    </span>
  );
};

export default MatchStatusBadge;
