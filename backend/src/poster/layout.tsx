import type { CSSProperties, ReactNode } from 'react';
import { cardGap, cardPadding, colors } from './tokens.js';

export function PosterRoot({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  const style: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width,
    height,
    backgroundColor: colors.surface,
    fontFamily: 'NotoSC',
    color: colors.textPri,
    padding: cardPadding,
    gap: cardGap,
  };
  return <div style={style}>{children}</div>;
}

export function PosterCard({ children }: { children: ReactNode }) {
  const style: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.elevated,
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    padding: cardPadding,
  };
  return (
    <div style={style}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>{children}</div>
    </div>
  );
}

export function PosterTitle({ text }: { text: string }) {
  const style: CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    color: colors.textPri,
    display: 'flex',
  };
  return <div style={style}>{text}</div>;
}

export function PosterMuted({ children }: { children: ReactNode }) {
  const style: CSSProperties = {
    fontSize: 14,
    color: colors.textSec,
  };
  return <div style={style}>{children}</div>;
}

export function TeamDot({ colorHex }: { colorHex: string }) {
  return (
    <div
      style={{
        width: 12,
        height: 12,
        borderRadius: 9999,
        backgroundColor: colorHex,
        flexShrink: 0,
      }}
    />
  );
}

export function RankBadge({ rank }: { rank: number }) {
  const top = rank >= 1 && rank <= 3;
  const style: CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    backgroundColor: top ? colors.primary : colors.chipBg,
    color: top ? colors.textInv : colors.textSec,
  };
  return <div style={style}>{rank}</div>;
}

export function ResultChip({
  label,
  variant,
}: {
  label: string;
  variant: 'win' | 'draw' | 'loss' | 'neutral';
}) {
  const bg =
    variant === 'win'
      ? `${colors.primary}26`
      : variant === 'loss'
        ? `${colors.danger}1a`
        : colors.chipBg;
  const fg =
    variant === 'win' ? colors.primaryDk : variant === 'loss' ? colors.danger : colors.textSec;
  const style: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 9999,
    backgroundColor: bg,
    color: fg,
  };
  return <div style={style}>{label}</div>;
}

export function ZebraRow({
  zebra,
  children,
}: {
  zebra: boolean;
  children: ReactNode;
}) {
  const style: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 12px',
    borderRadius: 12,
    backgroundColor: zebra ? `${colors.chipBg}80` : 'transparent',
  };
  return <div style={style}>{children}</div>;
}
