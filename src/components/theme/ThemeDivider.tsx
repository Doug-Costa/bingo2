'use client';

/** ThemeDivider.tsx — porte de `tvapp1/src/components/theme/ThemeDivider.tsx`. */
import type { CSSProperties } from 'react';
import { resolveThemeColor, combineStyles } from './utils';
import type { ThemeComponentProps, ThemeDividerVariant } from './types';

export interface ThemeDividerProps extends ThemeComponentProps {
  variant?: ThemeDividerVariant;
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  size?: number | string;
  margin?: number;
  glow?: boolean;
}

export function ThemeDivider({
  theme,
  variant = 'muted',
  orientation = 'horizontal',
  thickness = 1,
  size = '100%',
  margin = 8,
  glow = false,
  style,
  testID,
  accessibilityLabel,
}: ThemeDividerProps) {
  let colorKey = 'borderMuted';
  if (variant === 'gold') {
    colorKey = 'borderPrimary';
  } else if (variant === 'blue') {
    colorKey = 'borderSecondary';
  }

  const dividerColor = resolveThemeColor(theme, colorKey, 'rgba(255, 255, 255, 0.1)');

  const isHorizontal = orientation === 'horizontal';
  const sizeStyle: CSSProperties = isHorizontal
    ? { width: size, height: thickness, marginTop: margin, marginBottom: margin }
    : { width: thickness, height: size, marginLeft: margin, marginRight: margin };

  const glowStyle: CSSProperties =
    glow && variant !== 'muted' ? { boxShadow: `0px 0px 4px ${dividerColor}` } : {};

  const finalStyle = combineStyles<CSSProperties>(
    { backgroundColor: dividerColor, flexShrink: 0 },
    sizeStyle,
    glowStyle,
    style,
  );

  return <div style={finalStyle} data-testid={testID} aria-label={accessibilityLabel} />;
}

export default ThemeDivider;
