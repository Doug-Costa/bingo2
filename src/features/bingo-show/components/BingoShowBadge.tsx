/**
 * BingoShowBadge.tsx — porte de `tvapp1/src/features/bingo-show/components/BingoShowBadge.tsx`.
 */
import type { CSSProperties } from 'react';
import { BingoShowColors, BingoShowRadius, BingoShowSpacing, BingoShowTypography } from '../design-system';

export type BingoShowBadgeVariant = 'gold' | 'cyan' | 'green' | 'danger' | 'neutral';

export interface BingoShowBadgeProps {
  label: string;
  variant?: BingoShowBadgeVariant;
  style?: CSSProperties;
  textStyle?: CSSProperties;
}

export function BingoShowBadge({ label, variant = 'gold', style, textStyle }: BingoShowBadgeProps) {
  let bgColor: string;
  let borderColor: string;
  switch (variant) {
    case 'cyan':
      bgColor = 'rgba(0, 229, 255, 0.2)';
      borderColor = BingoShowColors.cyanNeon;
      break;
    case 'green':
      bgColor = 'rgba(0, 255, 136, 0.2)';
      borderColor = BingoShowColors.greenSuccess;
      break;
    case 'danger':
      bgColor = 'rgba(255, 51, 51, 0.2)';
      borderColor = BingoShowColors.redDanger;
      break;
    case 'neutral':
      bgColor = 'rgba(255, 255, 255, 0.1)';
      borderColor = BingoShowColors.borderSubtle;
      break;
    case 'gold':
    default:
      bgColor = 'rgba(255, 222, 56, 0.2)';
      borderColor = BingoShowColors.primary;
      break;
  }

  const textColor =
    variant === 'cyan'
      ? BingoShowColors.cyanNeon
      : variant === 'green'
      ? BingoShowColors.greenSuccess
      : variant === 'danger'
      ? BingoShowColors.redDanger
      : variant === 'neutral'
      ? BingoShowColors.textSecondary
      : BingoShowColors.primary;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: BingoShowSpacing.sm,
        paddingRight: BingoShowSpacing.sm,
        paddingTop: BingoShowSpacing.xxs,
        paddingBottom: BingoShowSpacing.xxs,
        borderRadius: BingoShowRadius.pill,
        border: `2px solid ${borderColor}`,
        backgroundColor: bgColor,
        boxShadow: `0 0 16px ${borderColor}66`,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: (style?.fontSize as any) ?? textStyle?.fontSize ?? BingoShowTypography.fontSize.tiny,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: textColor,
          textShadow: `0 0 10px ${borderColor}88`,
          ...textStyle,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default BingoShowBadge;
