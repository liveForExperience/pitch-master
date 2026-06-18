import React from 'react';
import { POSTER_THEMES, type PosterThemeKey } from './posterTheme';

interface ReportPosterProps {
  posterRef: React.RefObject<HTMLDivElement>;
  match: any;
  posterDate: { full: string; short: string };
  games: any[];
  teamNames: Record<number, string>;
  standings: any;
  stats: any;
  groupsData: any;
  theme?: PosterThemeKey;
}

const GROUP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const ReportPoster: React.FC<ReportPosterProps> = ({
  posterRef, match, posterDate, games, teamNames, standings, stats, groupsData, theme = 'night'
}) => {
  const t = POSTER_THEMES[theme].tokens;
  const isNight = theme === 'night';

  const getTeamLabel = (idx: number) => teamNames?.[idx] || `Team ${GROUP_LABELS[idx] ?? idx + 1}`;

  const championTeamIndex = standings?.standings?.[0]?.teamIndex;
  const championPlayers = championTeamIndex !== undefined ? groupsData?.groups?.[championTeamIndex] : [];
  const championTeamName = championTeamIndex !== undefined ? getTeamLabel(championTeamIndex) : '';

  const S: React.CSSProperties = {
    backgroundColor: t.bg,
    width: 375,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  };

  const sectionLabel = (_text: string, color?: string): React.CSSProperties => ({
    fontSize: 9,
    fontWeight: 800,
    color: color ?? t.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    marginBottom: 10,
  });

  return (
    <div className="fixed -left-[9999px] top-0">
      <div ref={posterRef} style={S}>

        {/* Top accent bar */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${t.accent}, ${isNight ? '#0ea5e9' : '#34d399'})` }} />

        {/* Watermark */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          fontSize: 80, fontWeight: 900, fontStyle: 'italic',
          color: t.watermark, lineHeight: 1,
          paddingRight: 16, paddingTop: 20,
          pointerEvents: 'none', userSelect: 'none', letterSpacing: '-0.04em',
        }}>
          REPORT
        </div>

        <div style={{ padding: '24px 24px 0', position: 'relative', zIndex: 10 }}>

          {/* ── HEADER ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              borderRadius: 999, border: `1px solid ${t.accentBorder}`,
              backgroundColor: t.accentBg, padding: '4px 12px',
              fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
              color: t.accentText, textTransform: 'uppercase', marginBottom: 12,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: t.accent }} />
              MATCH REPORT · {match?.tournamentName || '周赛'}
            </div>

            <div style={{
              fontSize: 24, fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.02em',
              color: t.textPrimary, marginBottom: 8, wordBreak: 'break-all',
            }}>
              {match?.title}
            </div>

            <div style={{ width: 40, height: 3, borderRadius: 2, backgroundColor: t.accent, marginBottom: 10 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: t.textSecondary }}>
                🕐 {posterDate.full}
              </span>
              <span style={{ fontSize: 11, fontWeight: 500, color: t.textSecondary }}>
                📍 {match?.location || '待定'}
              </span>
            </div>
          </div>

          {/* ── CHAMPION ── */}
          {championPlayers && championPlayers.length > 0 && (
            <div style={{
              borderRadius: 14, border: `1px solid ${t.goldBorder}`,
              backgroundColor: t.goldBg, padding: '14px 14px 12px', marginBottom: 16,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10, paddingBottom: 8,
                borderBottom: `1px solid ${t.goldBorder}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>🏆</span>
                  <span style={{ fontSize: 10, fontWeight: 900, color: t.gold, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    冠军队伍
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 900, color: t.textPrimary, fontStyle: 'italic' }}>
                  {championTeamName}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {championPlayers.map((p: any) => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    border: `1px solid ${t.goldBorder}`,
                    borderRadius: 999, padding: '4px 10px',
                    backgroundColor: isNight ? 'rgba(251,191,36,0.1)' : '#fffbeb',
                    lineHeight: 1
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: t.gold, display: 'flex', alignItems: 'center' }}>
                      {(p.name || '?')[0]}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.textPrimary, display: 'flex', alignItems: 'center' }}>
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── GAMES ── */}
          {games && games.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={sectionLabel('赛况记录', t.textMuted)}>
                ⚡ 赛况记录
              </div>
              <div style={{
                borderRadius: 12, border: `1px solid ${t.border}`,
                backgroundColor: t.card, overflow: 'hidden',
              }}>
                {games.slice(0, 6).map((g: any, idx: number) => (
                  <div key={g.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 56px 1fr',
                    alignItems: 'center',
                    padding: '9px 14px',
                    borderBottom: idx < Math.min(games.length, 6) - 1 ? `1px solid ${t.border}` : 'none',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : isNight ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.02)',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.textPrimary, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 6 }}>
                      {getTeamLabel(g.teamAIndex)}
                    </span>
                    <span style={{
                      fontSize: 14, fontWeight: 900, color: t.accent,
                      textAlign: 'center', letterSpacing: '-0.02em',
                    }}>
                      {g.scoreA} : {g.scoreB}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.textPrimary, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 6 }}>
                      {getTeamLabel(g.teamBIndex)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STANDINGS ── */}
          {standings?.standings && standings.standings.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={sectionLabel('积分榜')}>
                🏅 积分榜 Standings
              </div>
              <div style={{
                borderRadius: 12, border: `1px solid ${t.border}`,
                backgroundColor: t.card, overflow: 'hidden',
              }}>
                {/* Header row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '28px 1fr 34px 34px 38px',
                  padding: '7px 14px',
                  backgroundColor: isNight ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
                  borderBottom: `1px solid ${t.border}`,
                }}>
                  {['#', '队伍', '胜', '负', 'Pts'].map((h, i) => (
                    <span key={i} style={{
                      fontSize: 9, fontWeight: 800, color: t.textMuted,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      textAlign: i >= 2 ? 'center' : 'left',
                    }}>
                      {h}
                    </span>
                  ))}
                </div>
                {standings.standings.slice(0, 4).map((row: any, i: number) => (
                  <div key={row.teamIndex} style={{
                    display: 'grid', gridTemplateColumns: '28px 1fr 34px 34px 38px',
                    alignItems: 'center', padding: '9px 14px',
                    borderBottom: i < 3 ? `1px solid ${t.border}` : 'none',
                    backgroundColor: i === 0 ? (isNight ? 'rgba(251,191,36,0.05)' : '#fffbeb') : 'transparent',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: i === 0 ? t.gold : t.textMuted }}>
                      {row.rank}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, paddingRight: 4 }}>
                      {row.teamName}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: t.textSecondary, textAlign: 'center' }}>
                      {row.wins ?? '-'}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: t.textSecondary, textAlign: 'center' }}>
                      {row.losses ?? '-'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: t.accent, textAlign: 'center' }}>
                      {row.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STATS: Scorers + Assisters stacked ── */}
          {stats && (
            <div style={{ marginBottom: 16 }}>
              {/* Top Scorers */}
              {stats.topScorers && stats.topScorers.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={sectionLabel('射手榜', isNight ? '#38bdf8' : '#0369a1')}>
                    ⚽ 射手榜
                  </div>
                  <div style={{
                    borderRadius: 12, border: `1px solid ${t.border}`,
                    backgroundColor: t.card, overflow: 'hidden',
                  }}>
                    {stats.topScorers.slice(0, 3).map((p: any, i: number) => (
                      <div key={p.playerId} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '9px 14px',
                        borderBottom: i < 2 ? `1px solid ${t.border}` : 'none',
                        backgroundColor: i === 0 ? (isNight ? 'rgba(251,191,36,0.04)' : '#fffbeb') : 'transparent',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: 12, fontWeight: 900, color: i === 0 ? t.gold : t.textMuted, flexShrink: 0, width: 16 }}>
                            {i + 1}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: t.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.playerName}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 900, color: isNight ? '#38bdf8' : '#0369a1', flexShrink: 0, marginLeft: 12 }}>
                          {p.goals} 球
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Assisters */}
              {stats.topAssisters && stats.topAssisters.length > 0 && (
                <div>
                  <div style={sectionLabel('助攻榜', isNight ? '#34d399' : '#059669')}>
                    🎯 助攻榜
                  </div>
                  <div style={{
                    borderRadius: 12, border: `1px solid ${t.border}`,
                    backgroundColor: t.card, overflow: 'hidden',
                  }}>
                    {stats.topAssisters.slice(0, 3).map((p: any, i: number) => (
                      <div key={p.playerId} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '9px 14px',
                        borderBottom: i < 2 ? `1px solid ${t.border}` : 'none',
                        backgroundColor: i === 0 ? (isNight ? 'rgba(251,191,36,0.04)' : '#fffbeb') : 'transparent',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: 12, fontWeight: 900, color: i === 0 ? t.gold : t.textMuted, flexShrink: 0, width: 16 }}>
                            {i + 1}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: t.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.playerName}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 900, color: isNight ? '#34d399' : '#059669', flexShrink: 0, marginLeft: 12 }}>
                          {p.assists} 次
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FOOTER ── */}
          <div style={{
            paddingTop: 14, paddingBottom: 20,
            borderTop: `1px solid ${t.divider}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          }}>
            <div>
              <div style={{ fontSize: 8, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
                Powered by
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.03em', color: t.textPrimary }}>
                OLDBOY <span style={{ color: t.accent }}>CLUB</span>
              </div>
            </div>
            <div style={{ fontSize: 10, color: t.textMuted, fontWeight: 600 }}>
              {posterDate.short}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportPoster;
