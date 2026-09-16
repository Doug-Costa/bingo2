/**
 * BingoShowText.tsx — porte de `tvapp1/src/features/bingo-show/components/BingoShowText.tsx`.
 * `includeFontPadding` (RN, sem equivalente web) removido.
 */
import type { CSSProperties, ReactNode } from 'react';
import { BingoShowColors, BingoShowTypography } from '../design-system';

export type BingoShowTextPreset = 'hero' | 'title' | 'titleMedium' | 'body' | 'label' | 'digital';

export interface BingoShowTextProps {
  preset?: BingoShowTextPreset;
  color?: keyof typeof BingoShowColors;
  align?: 'left' | 'right' | 'center' | 'justify';
  numberOfLines?: number;
  style?: CSSProperties;
  children?: ReactNode;
}

export function BingoShowText({ preset = 'body', color = 'textPrimary', align = 'left', numberOfLines, style, children }: BingoShowTextProps) {
  const textColor = BingoShowColors[color];

  let presetStyle: CSSProperties;
  switch (preset) {
    case 'hero':
      presetStyle = {
        fontSize: BingoShowTypography.presets.displayHero.fontSize,
        fontWeight: BingoShowTypography.presets.displayHero.fontWeight,
        letterSpacing: BingoShowTypography.presets.displayHero.letterSpacing,
      };
      break;
    case 'title':
      presetStyle = {
        fontSize: BingoShowTypography.presets.titleLarge.fontSize,
        fontWeight: BingoShowTypography.presets.titleLarge.fontWeight,
        letterSpacing: BingoShowTypography.presets.titleLarge.letterSpacing,
      };
      break;
    case 'titleMedium':
      presetStyle = {
        fontSize: BingoShowTypography.presets.titleMedium.fontSize,
        fontWeight: BingoShowTypography.presets.titleMedium.fontWeight,
        letterSpacing: BingoShowTypography.presets.titleMedium.letterSpacing,
      };
      break;
    case 'label':
      presetStyle = {
        fontSize: BingoShowTypography.presets.labelSmall.fontSize,
        fontWeight: BingoShowTypography.presets.labelSmall.fontWeight,
        letterSpacing: BingoShowTypography.presets.labelSmall.letterSpacing,
        textTransform: BingoShowTypography.presets.labelSmall.textTransform,
      };
      break;
    case 'digital':
      presetStyle = {
        fontFamily: BingoShowTypography.presets.digitalCountdown.fontFamily,
        fontSize: BingoShowTypography.presets.digitalCountdown.fontSize,
        fontWeight: BingoShowTypography.presets.digitalCountdown.fontWeight,
      };
      break;
    case 'body':
    default:
      presetStyle = {
        fontSize: BingoShowTypography.presets.bodyMedium.fontSize,
        fontWeight: BingoShowTypography.presets.bodyMedium.fontWeight,
        letterSpacing: BingoShowTypography.presets.bodyMedium.letterSpacing,
      };
      break;
  }

  const clampStyle: CSSProperties =
    numberOfLines === 1
      ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
      : numberOfLines && numberOfLines > 1
      ? { display: '-webkit-box', WebkitLineClamp: numberOfLines, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
      : {};

  return (
    <span
      style={{
        margin: 0,
        ...presetStyle,
        color: textColor,
        textAlign: align,
        ...clampStyle,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export default BingoShowText;
