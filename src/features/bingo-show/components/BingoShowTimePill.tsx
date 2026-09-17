import React from 'react';
import { BingoShowIcon, BingoShowIconName } from './BingoShowIcon';
import { BingoShowGlowHalo } from './BingoShowGlowHalo';
import { BingoShowColors, BingoShowSpacing } from '../design-system';
import { useAppTheme } from '@/contexts/ThemeContext';

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
  color,
  glow = true,
  style,
}) => {
  const { theme } = useAppTheme();
  const effectiveColor = color || theme.secondary || BingoShowColors.cyanNeon;

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: BingoShowSpacing.xs,
        backgroundColor: theme.panelBg || 'rgba(6, 12, 40, 0.75)',
        border: `2.5px solid ${effectiveColor}`,
        borderRadius: 40,
        paddingLeft: BingoShowSpacing.md,
        paddingRight: BingoShowSpacing.md,
        paddingTop: BingoShowSpacing.xs,
        paddingBottom: BingoShowSpacing.xs,
        boxSizing: 'border-box',
        boxShadow: `0 0 12px ${effectiveColor}44`,
        ...style,
      }}
    >
      <BingoShowIcon name={icon} size={28} color={effectiveColor} transparentBg />
      <span
        suppressHydrationWarning
        style={{
          fontFamily: 'monospace, sans-serif',
          fontSize: 26,
          fontWeight: 700,
          color: theme.textPrimary || BingoShowColors.textPrimary,
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
    <BingoShowGlowHalo color={effectiveColor} bleed={28} intensity={0.4} pulseDuration={3200}>
      {content}
    </BingoShowGlowHalo>
  );
};

export default BingoShowTimePill;
