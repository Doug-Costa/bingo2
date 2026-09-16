'use client';

/**
 * ThemeBorder.tsx — porte de `tvapp1/src/components/theme/ThemeBorder.tsx`.
 * `ImageBackground resizeMode="stretch"` → `backgroundSize: '100% 100%'`.
 */
import type { CSSProperties } from 'react';
import { resolveThemeColor, resolveThemeRadius, resolveThemeAsset, combineStyles } from './utils';
import type { ThemeComponentProps, ThemeState } from './types';

export interface ThemeBorderProps extends ThemeComponentProps, ThemeState {
  variant?: 'default' | 'gold' | 'blue' | 'neon' | 'glass' | 'focus' | 'winner';
  borderRadius?: number;
  borderWidth?: number;
  useImageBorder?: boolean;
}

export function ThemeBorder({
  theme,
  variant = 'default',
  focused = false,
  borderRadius,
  borderWidth = 1.5,
  useImageBorder = true,
  style,
  children,
  testID,
  accessibilityLabel,
}: ThemeBorderProps) {
  const finalRadius = borderRadius ?? resolveThemeRadius(theme, 'medium', 12);

  let borderCol = resolveThemeColor(theme, 'borderSecondary', 'rgba(255,255,255,0.15)');
  let finalWidth = borderWidth;

  if (variant === 'gold') {
    borderCol = resolveThemeColor(theme, 'borderPrimary', '#ffde38');
    finalWidth = 2.0;
  } else if (variant === 'blue') {
    borderCol = resolveThemeColor(theme, 'borderSecondary', '#4868ff');
    finalWidth = 2.0;
  } else if (variant === 'neon') {
    borderCol = resolveThemeColor(theme, 'primaryGlow', 'rgba(72,104,255,0.6)');
    finalWidth = 2.5;
  } else if (variant === 'focus' || focused) {
    borderCol = resolveThemeColor(theme, 'focus', '#ffde38');
    finalWidth = 3.0;
  } else if (variant === 'winner') {
    borderCol = resolveThemeColor(theme, 'success', '#00d54f');
    finalWidth = 3.0;
  }

  let borderImage: string | null = null;
  if (useImageBorder && theme.assets) {
    switch (variant) {
      case 'focus':
        borderImage = resolveThemeAsset(theme, 'borders', 'borderFocused');
        break;
      case 'winner':
        borderImage = resolveThemeAsset(theme, 'borders', 'borderWinner');
        break;
      case 'glass':
        borderImage = resolveThemeAsset(theme, 'borders', 'borderGlass');
        break;
      case 'gold':
        borderImage = resolveThemeAsset(theme, 'borders', 'borderNeonGold');
        break;
      case 'blue':
      case 'neon':
        borderImage = resolveThemeAsset(theme, 'borders', 'borderNeonBlue');
        break;
    }
  }

  const containerStyle = combineStyles<CSSProperties>(
    { overflow: 'hidden', boxSizing: 'border-box' },
    {
      borderColor: borderImage ? 'transparent' : borderCol,
      borderStyle: 'solid',
      borderWidth: borderImage ? 0 : finalWidth,
      borderRadius: finalRadius,
      backgroundImage: borderImage ? `url(${borderImage})` : undefined,
      backgroundSize: borderImage ? '100% 100%' : undefined,
    },
    style,
  );

  return (
    <div style={containerStyle} data-testid={testID} aria-label={accessibilityLabel}>
      {/* Margem segura interna para afastar o conteúdo da borda neon quando há imagem. */}
      <div style={borderImage ? { padding: 4 } : undefined}>{children}</div>
    </div>
  );
}

export default ThemeBorder;
