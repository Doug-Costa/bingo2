import React from 'react';
import { BingoShowIcon, BingoShowIconName } from './BingoShowIcon';
import { BingoShowGlowHalo } from './BingoShowGlowHalo';
import { BingoShowColors, BingoShowSpacing } from '../design-system';

export interface BingoShowTimePillProps {
  icon?: BingoShowIconName;
  text: string;
  color?: string;
  glow?: boolean;
  style?: React.CSSProperties;
}

export const BingoShowTimePill: React.FC<BingoShowTimePillProps> = ({
  icon = 'clock',
  text,
  color = BingoShowColors.cyanNeon,
  glow = true,
  style,
}) => {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: BingoShowSpacing.xs,
        backgroundColor: 'rgba(6, 12, 40, 0.75)',
        border: `3px solid ${color}`,
        borderRadius: 40,
        paddingLeft: BingoShowSpacing.md,
        paddingRight: BingoShowSpacing.md,
        paddingTop: BingoShowSpacing.xs,
        paddingBottom: BingoShowSpacing.xs,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <BingoShowIcon name={icon} size={32} color={color} transparentBg />
      <span
        suppressHydrationWarning
        style={{
          fontFamily: 'monospace, sans-serif',
          fontSize: 28,
          fontWeight: 700,
          color: BingoShowColors.textPrimary,
          letterSpacing: 2,
        }}
      >
        {text}
      </span>
    </div>
  );

  if (!glow) {
    return content;
  }

  return (
    <BingoShowGlowHalo color={color} bleed={28} intensity={0.4} pulseDuration={3200}>
      {content}
    </BingoShowGlowHalo>
  );
};

export default BingoShowTimePill;
