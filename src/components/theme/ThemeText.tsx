'use client';

/**
 * ThemeText.tsx — porte de `tvapp1/src/components/theme/ThemeText.tsx`.
 *
 * Simplificação de escopo (só tema04): o RN tinha um fallback elaborado
 * para variantes de tipografia quando `theme.typography` não existia
 * (temas antigos sem os tokens novos) — `temaBingoShow` SEMPRE define as
 * 18 variantes, então esse branch nunca executava na prática para o tema
 * migrado; removido, mantendo só um fallback defensivo mínimo.
 *
 * `adjustsFontSizeToFit`/`minimumFontScale` (RN, sem equivalente web) →
 * `text-overflow: ellipsis` (mesma decisão já tomada na Fase 1 para os
 * componentes Bingo Show V2). `numberOfLines > 1` → `-webkit-line-clamp`.
 */
import type { CSSProperties, ReactNode } from 'react';
import Typography from '@/theme/typography';
import { resolveThemeColor, combineStyles } from './utils';
import type { ThemeComponentProps, ThemeTextVariant } from './types';

export interface ThemeTextProps extends ThemeComponentProps {
  variant?: ThemeTextVariant;
  /** Aceita hex direto ou chaves semânticas (ex.: 'primary', 'textPrimary'). */
  color?: string;
  align?: 'left' | 'right' | 'center' | 'justify';
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
  uppercase?: boolean;
  shadow?: boolean;
  glow?: boolean;
  textStyle?: CSSProperties;
  as?: 'span' | 'div' | 'p';
}

export function ThemeText({
  theme,
  variant = 'bodyMedium',
  color = 'textPrimary',
  align = 'left',
  numberOfLines,
  adjustsFontSizeToFit,
  uppercase = false,
  shadow = false,
  glow = false,
  textStyle,
  children,
  testID,
  accessibilityLabel,
  as = 'span',
}: ThemeTextProps) {
  const textColor = resolveThemeColor(theme, color, color);

  const typeStyle = (theme.typography?.[variant] as CSSProperties | undefined) ??
    (Typography[variant] as CSSProperties | undefined) ?? {
      fontSize: 14,
      fontWeight: 400,
    };

  let effectsStyle: CSSProperties = {};
  if (shadow) {
    effectsStyle = { textShadow: '0px 2px 4px rgba(0, 0, 0, 0.75)' };
  } else if (glow) {
    const glowColor = theme.primaryGlow || resolveThemeColor(theme, 'borderGlow', 'rgba(72,104,255,0.6)');
    effectsStyle = { textShadow: `0px 0px 8px ${glowColor}` };
  }

  const clampStyle: CSSProperties =
    numberOfLines === 1 || adjustsFontSizeToFit
      ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
      : numberOfLines && numberOfLines > 1
      ? {
          display: '-webkit-box',
          WebkitLineClamp: numberOfLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }
      : {};

  const finalStyle = combineStyles<CSSProperties>(
    typeStyle,
    { color: textColor, textAlign: align, margin: 0 },
    effectsStyle,
    clampStyle,
    textStyle,
  );

  const textContent: ReactNode =
    uppercase && typeof children === 'string' ? children.toUpperCase() : children;

  const Tag = as;
  return (
    <Tag style={finalStyle} data-testid={testID} aria-label={accessibilityLabel}>
      {textContent}
    </Tag>
  );
}

export default ThemeText;
