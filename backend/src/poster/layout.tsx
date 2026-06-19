import type { CSSProperties, ReactNode } from 'react';
import { colors, fonts } from './tokens.js';

/**
 * Editorial-minimalist poster primitives.
 *
 * Composition rules (satori-safe):
 *  - every node has display: 'flex' (satori requirement)
 *  - dividers are 1px hairline borders, never filled cards
 *  - numerals use GeistMono with tabular-nums (no kerning surprises)
 *  - hero serif accents use Newsreader Italic
 */

export const POSTER_OUTER_PADDING = 64;

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
    fontFamily: fonts.sans,
    color: colors.textPri,
    padding: POSTER_OUTER_PADDING,
  };
  return <div style={style}>{children}</div>;
}

export function PosterHeader({
  eyebrow,
  shortCode,
}: {
  eyebrow: string;
  shortCode: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 24,
      }}
    >
      <Eyebrow text={eyebrow} />
      <Eyebrow text={shortCode} muted />
    </div>
  );
}

export function PosterFooter({ shortCode }: { shortCode: string }) {
  return (
    <div
      style={{
        marginTop: 'auto',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingTop: 32,
        borderTop: `1px solid ${colors.border}`,
      }}
    >
      <PitchMark />
      <span
        style={{
          fontFamily: fonts.mono,
          fontSize: 18,
          letterSpacing: '0.14em',
          color: colors.textPri,
          textTransform: 'uppercase',
        }}
      >
        PITCHMASTER
      </span>
      <span style={{ flex: 1 }} />
      <span
        style={{
          fontFamily: fonts.mono,
          fontSize: 18,
          color: colors.textSec,
          letterSpacing: '0.12em',
        }}
      >
        {shortCode}
      </span>
    </div>
  );
}

export function Section({
  title,
  children,
  hairlineTop = true,
  padTop = 32,
  padBottom = 32,
}: {
  title?: string;
  children: ReactNode;
  hairlineTop?: boolean;
  padTop?: number;
  padBottom?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        paddingTop: padTop,
        paddingBottom: padBottom,
        borderTop: hairlineTop ? `1px solid ${colors.border}` : 'none',
      }}
    >
      {title && (
        <div style={{ display: 'flex', paddingBottom: 18 }}>
          <Eyebrow text={title} />
        </div>
      )}
      {children}
    </div>
  );
}

export function Eyebrow({ text, muted = false }: { text: string; muted?: boolean }) {
  return (
    <span
      style={{
        display: 'flex',
        fontFamily: fonts.mono,
        fontSize: 16,
        letterSpacing: '0.18em',
        color: muted ? colors.textSec : colors.textPri,
        textTransform: 'uppercase',
        fontWeight: 500,
      }}
    >
      {text}
    </span>
  );
}

export function HairlineRow({
  children,
  height = 64,
  last = false,
}: {
  children: ReactNode;
  height?: number;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height,
        borderBottom: last ? 'none' : `1px solid ${colors.border}`,
      }}
    >
      {children}
    </div>
  );
}

export function TeamDot({ colorHex, size = 14 }: { colorHex: string; size?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        width: size,
        height: size,
        borderRadius: 9999,
        backgroundColor: colorHex,
        flexShrink: 0,
      }}
    />
  );
}

export function TeamBar({
  colorHex,
  width = 6,
  height = 64,
}: {
  colorHex: string;
  width?: number;
  height?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        width,
        height,
        backgroundColor: colorHex,
        flexShrink: 0,
      }}
    />
  );
}

/**
 * Minimalist inline pitch icon (24x24, hairline stroked).
 * Drawn via nested flex divs because satori does not parse arbitrary SVG.
 */
export function PitchMark({ size = 28 }: { size?: number }) {
  const stroke = colors.primary;
  return (
    <div
      style={{
        display: 'flex',
        width: size,
        height: size,
        border: `2px solid ${stroke}`,
        borderRadius: 4,
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: size / 2 - 1,
          top: 0,
          width: 2,
          height: size - 4,
          backgroundColor: stroke,
        }}
      />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: size / 2 - size / 6,
          top: size / 2 - size / 6,
          width: size / 3,
          height: size / 3,
          border: `2px solid ${stroke}`,
          borderRadius: 9999,
          backgroundColor: colors.surface,
        }}
      />
    </div>
  );
}

export function StatBadge({
  value,
  label,
  hairlineLeft = false,
  cjk = false,
}: {
  value: string;
  label: string;
  hairlineLeft?: boolean;
  /** Use NotoSC bold instead of Geist Mono when value is CJK (e.g. MVP name). */
  cjk?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        paddingTop: 28,
        paddingBottom: 28,
        borderLeft: hairlineLeft ? `1px solid ${colors.border}` : 'none',
      }}
    >
      <span
        style={{
          display: 'flex',
          fontFamily: cjk ? fonts.sans : fonts.mono,
          fontSize: cjk ? 56 : 88,
          fontWeight: cjk ? 700 : 500,
          color: colors.textPri,
          letterSpacing: cjk ? '-0.02em' : '-0.04em',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <Eyebrow text={label} muted />
    </div>
  );
}

export function RankNumeral({ rank, dim = false }: { rank: number; dim?: boolean }) {
  return (
    <span
      style={{
        display: 'flex',
        width: 36,
        fontFamily: fonts.mono,
        fontSize: 22,
        color: dim ? colors.textSec : colors.textPri,
      }}
    >
      {String(rank).padStart(2, '0')}
    </span>
  );
}

export function MonoNumeral({
  text,
  size = 22,
  color,
  width,
  align = 'left',
}: {
  text: string;
  size?: number;
  color?: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <span
      style={{
        display: 'flex',
        justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
        fontFamily: fonts.mono,
        fontSize: size,
        color: color ?? colors.textPri,
        width,
      }}
    >
      {text}
    </span>
  );
}

export function SerifVerdict({ text, size = 56 }: { text: string; size?: number }) {
  return (
    <span
      style={{
        display: 'flex',
        fontFamily: fonts.serif,
        fontStyle: 'italic',
        fontSize: size,
        fontWeight: 500,
        color: colors.textPri,
      }}
    >
      {text}
    </span>
  );
}
