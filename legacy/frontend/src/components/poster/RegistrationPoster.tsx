import React from 'react';
import { POSTER_THEMES, type PosterThemeKey } from './posterTheme';

interface RegistrationPosterProps {
  posterRef: React.RefObject<HTMLDivElement>;
  match: any;
  posterDate: { full: string; month: string; day: string; weekday: string };
  registeredCount: number;
  totalCapacity: number;
  theme?: PosterThemeKey;
}

const RegistrationPoster: React.FC<RegistrationPosterProps> = ({
  posterRef, match, posterDate, registeredCount, totalCapacity, theme = 'night'
}) => {
  const t = POSTER_THEMES[theme].tokens;
  const fillPct = totalCapacity > 0 ? Math.min(100, Math.round((registeredCount / totalCapacity) * 100)) : 0;
  const isNight = theme === 'night';

  return (
    <div className="fixed -left-[9999px] top-0">
      <div
        ref={posterRef}
        style={{ backgroundColor: t.bg, width: 375, fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', overflow: 'hidden' }}
      >
        {/* Watermark text */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          fontSize: 96, fontWeight: 900, fontStyle: 'italic',
          color: t.watermark, lineHeight: 1, paddingRight: 16, paddingTop: 20,
          pointerEvents: 'none', userSelect: 'none', letterSpacing: '-0.04em',
        }}>
          OLDBOY
        </div>

        {/* Top accent bar */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${t.accent}, ${isNight ? '#0ea5e9' : '#34d399'})` }} />

        <div style={{ padding: '28px 28px 24px', position: 'relative', zIndex: 10 }}>

          {/* Tournament badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            borderRadius: 999, border: `1px solid ${t.accentBorder}`,
            backgroundColor: t.accentBg, padding: '4px 12px',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            color: t.accentText, textTransform: 'uppercase', marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: t.accent }} />
            {match?.tournamentName || '周赛'}
          </div>

          {/* Title */}
          <div style={{
            fontSize: 26, fontWeight: 900, lineHeight: 1.2,
            color: t.textPrimary, letterSpacing: '-0.02em', marginBottom: 20,
            wordBreak: 'break-all',
          }}>
            {match?.title}
          </div>

          {/* Accent divider */}
          <div style={{ width: 48, height: 3, borderRadius: 2, backgroundColor: t.accent, marginBottom: 20 }} />

          {/* Info rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            <InfoRow icon="🕐" color={t.accentText} textColor={t.textSecondary}
              label={posterDate.full} />
            <InfoRow icon="📍" color={t.accentText} textColor={t.textSecondary}
              label={match?.location || '待定'} />
            <InfoRow icon="⚽" color={t.accentText} textColor={t.textSecondary}
              label={`${match?.numGroups ?? '-'} 组 · 每组 ${match?.playersPerGroup ?? '-'} 人 · ${match?.plannedGameCount ?? '-'} 场`} />
          </div>

          {/* Stats cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Registered count */}
              <div style={{
                borderRadius: 16, border: `1px solid ${t.border}`,
                backgroundColor: t.card, padding: '14px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                  已报名
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: t.accent, lineHeight: 1 }}>
                  {registeredCount}
                </div>
                {totalCapacity > 0 && (
                  <div style={{ fontSize: 10, color: t.textMuted, marginTop: 4 }}>
                    / {totalCapacity} 人
                  </div>
                )}
              </div>

              {/* Format */}
              <div style={{
                borderRadius: 16, border: `1px solid ${t.border}`,
                backgroundColor: t.card, padding: '14px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                  比赛场次
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: t.textPrimary, lineHeight: 1 }}>
                  {match?.plannedGameCount ?? '-'}
                </div>
                <div style={{ fontSize: 10, color: t.textMuted, marginTop: 4 }}>场</div>
              </div>
            </div>

            {/* Registration status card (full-width) */}
            <div style={{
              borderRadius: 16,
              border: `1px solid ${match?.status === 'PUBLISHED' ? t.accentBorder : t.border}`,
              backgroundColor: match?.status === 'PUBLISHED' ? t.accentBg : t.card,
              padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                报名状态
              </div>
              <div style={{ width: 1, height: 12, backgroundColor: t.divider }} />
              <div style={{ fontSize: 13, fontWeight: 800, color: match?.status === 'PUBLISHED' ? t.accentText : t.textMuted }}>
                {match?.status === 'PUBLISHED' ? '🟢 开放报名中' : '🔴 报名已截止'}
              </div>
            </div>
          </div>

          {/* Registration progress bar */}
          {totalCapacity > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: '0.08em' }}>
                  报名进度
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, color: t.accentText }}>
                  {fillPct}%
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, backgroundColor: isNight ? 'rgba(255,255,255,0.08)' : '#d1fae5', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${fillPct}%`, borderRadius: 3,
                  background: `linear-gradient(90deg, ${t.accent}, ${isNight ? '#0ea5e9' : '#34d399'})`,
                }} />
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{
            paddingTop: 16, borderTop: `1px solid ${t.divider}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          }}>
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
                Powered by
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.03em', color: t.textPrimary }}>
                OLDBOY <span style={{ color: t.accent }}>CLUB</span>
              </div>
            </div>
            <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 600 }}>
              {posterDate.full.split(' ')[0]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ icon: string; color: string; textColor: string; label: string }> = ({ icon, textColor, label }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
    <span style={{ fontSize: 12, lineHeight: '20px', flexShrink: 0 }}>{icon}</span>
    <span style={{ fontSize: 13, fontWeight: 500, color: textColor, lineHeight: '20px', wordBreak: 'break-all' }}>
      {label}
    </span>
  </div>
);

export default RegistrationPoster;
