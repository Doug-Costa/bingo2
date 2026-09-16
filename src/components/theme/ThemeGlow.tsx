'use client';

/**
 * ThemeGlow.tsx — porte de `tvapp1/src/components/theme/ThemeGlow.tsx`.
 * `elevation` descartado (Android-only). Sombra do container vira
 * `box-shadow` real (funciona bem melhor na web que no RN, já que CSS
 * `box-shadow` suporta blur nativamente). A imagem de glow atrás do
 * conteúdo (inset -15 nas 4 bordas, `zIndex: -1`) é portada 1:1.
 */
import type { CSSProperties } from 'react';
import { resolveThemeColor, resolveThemeRadius, resolveThemeAsset, combineStyles } from './utils';
import type { ThemeComponentProps, ThemeGlowVariant } from './types';

export interface ThemeGlowProps extends ThemeComponentProps {
  variant?: ThemeGlowVariant;
  borderRadius?: number;
  useImageEffect?: boolean;
}

export function ThemeGlow({
  theme,
  variant = 'soft',
  borderRadius,
  useImageEffect = true,
  style,
  children,
  testID,
  accessibilityLabel,
}: ThemeGlowProps) {
  const finalRadius = borderRadius ?? resolveThemeRadius(theme, 'medium', 12);

  let glowColor = '#000000';
  let glowRadius = 6;
  let glowOpacity = 0.4;

  if (variant === 'gold') {
    glowColor = resolveThemeColor(theme, 'goldPrimary', '#ffde38');
    glowRadius = 15;
    glowOpacity = 0.8;
  } else if (variant === 'blue') {
    glowColor = resolveThemeColor(theme, 'bluePrimary', '#4868ff');
    glowRadius = 15;
    glowOpacity = 0.8;
  } else if (variant === 'winner') {
    glowColor = resolveThemeColor(theme, 'success', '#00d54f');
    glowRadius = 20;
    glowOpacity = 0.9;
  } else if (variant === 'focus') {
    glowColor = resolveThemeColor(theme, 'focus', '#ffde38');
    glowRadius = 12;
    glowOpacity = 0.8;
  }

  let effectImage: string | null = null;
  if (useImageEffect && theme.assets) {
    if (variant === 'gold') {
      effectImage = resolveThemeAsset(theme, 'effects', 'effectGlowGold') || resolveThemeAsset(theme, 'effects', 'effectLightBurst');
    } else if (variant === 'blue') {
      effectImage = resolveThemeAsset(theme, 'effects', 'effectGlowBlue') || resolveThemeAsset(theme, 'effects', 'effectLightBurst');
    } else if (variant === 'winner') {
      effectImage = resolveThemeAsset(theme, 'effects', 'effectBloom') || resolveThemeAsset(theme, 'effects', 'effectLightBurst');
    }
  }

  const alphaPct = Math.round(glowOpacity * 100);
  const glowShadowColor = `color-mix(in srgb, ${glowColor} ${alphaPct}%, transparent)`;

  const containerStyle = combineStyles<CSSProperties>(
    { position: 'relative', overflow: 'visible' },
    {
      boxShadow: `0px 0px ${glowRadius}px ${glowShadowColor}`,
      borderRadius: finalRadius,
    },
    style,
  );

  return (
    <div style={containerStyle} data-testid={testID} aria-label={accessibilityLabel}>
      {/* Imagem de efeito de luz atrás do conteúdo, abrindo 15px pra fora em cada lado. */}
      {effectImage && (
        // eslint-disable-next-line @next/next/no-img-element -- porte 1:1, efeito decorativo posicionado à mão
        <img
          src={effectImage}
          alt=""
          style={{
            position: 'absolute',
            left: -15,
            right: -15,
            top: -15,
            bottom: -15,
            width: 'calc(100% + 30px)',
            height: 'calc(100% + 30px)',
            objectFit: 'cover',
            borderRadius: finalRadius,
            opacity: 0.35,
            zIndex: -1,
          }}
        />
      )}
      {children}
    </div>
  );
}

export default ThemeGlow;
