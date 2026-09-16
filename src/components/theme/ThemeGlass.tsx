'use client';

/**
 * ThemeGlass.tsx — porte de `tvapp1/src/components/theme/ThemeGlass.tsx`.
 * `elevation` (Android-only) descartado, só `box-shadow` via
 * shadowColor/Offset/Opacity/Radius (mesmos valores).
 */
import type { CSSProperties } from 'react';
import { resolveThemeColor, resolveThemeRadius, resolveThemeAsset, combineStyles } from './utils';
import type { ThemeComponentProps } from './types';

export interface ThemeGlassProps extends ThemeComponentProps {
  borderRadius?: number;
  borderWidth?: number;
  padding?: number;
  useGradient?: boolean;
  useTexture?: boolean;
}

const absoluteFill: CSSProperties = { position: 'absolute', inset: 0 };

export function ThemeGlass({
  theme,
  borderRadius,
  borderWidth = 1,
  padding = 12,
  useGradient = true,
  useTexture = true,
  style,
  children,
  testID,
  accessibilityLabel,
}: ThemeGlassProps) {
  const glassBgColor = resolveThemeColor(theme, 'surfaceGlass', 'rgba(11, 21, 117, 0.8)');
  const borderCol = resolveThemeColor(theme, 'borderMuted', 'rgba(255, 255, 255, 0.12)');
  const finalRadius = borderRadius ?? resolveThemeRadius(theme, 'medium', 12);

  const gradientColors = ['rgba(255, 255, 255, 0.07)', 'rgba(255, 255, 255, 0.01)', 'rgba(0, 0, 0, 0.2)'];

  let textureSource: string | null = null;
  if (useTexture && theme.assets) {
    textureSource = resolveThemeAsset(theme, 'textures', 'textureGlass') || resolveThemeAsset(theme, 'textures', 'textureNoise');
  }

  const containerStyle = combineStyles<CSSProperties>(
    { position: 'relative', overflow: 'hidden', boxShadow: '0px 6px 10px rgba(0,0,0,0.4)' },
    {
      backgroundColor: glassBgColor,
      borderColor: borderCol,
      borderStyle: 'solid',
      borderWidth,
      borderRadius: finalRadius,
      padding,
    },
    style,
  );

  return (
    <div style={containerStyle} data-testid={testID} aria-label={accessibilityLabel}>
      {/* Camada 1: Gradiente de reflexo de vidro */}
      {useGradient && (
        <div
          style={{
            ...absoluteFill,
            borderRadius: finalRadius,
            background: `linear-gradient(160deg, ${gradientColors.join(', ')})`,
          }}
        />
      )}

      {/* Camada 2: Textura sobreposta fosca */}
      {textureSource && (
        <div
          style={{
            ...absoluteFill,
            opacity: 0.08,
            borderRadius: finalRadius,
            backgroundImage: `url(${textureSource})`,
            backgroundRepeat: 'repeat',
          }}
        />
      )}

      {/* Conteúdo */}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

export default ThemeGlass;
