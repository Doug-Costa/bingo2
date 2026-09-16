'use client';

/**
 * ThemeOverlay.tsx — porte de `tvapp1/src/components/theme/ThemeOverlay.tsx`.
 *
 * `pointerEvents="box-none"/"box-only"` (RN, sem equivalente exato em CSS —
 * `pointer-events` só tem `none`/`auto`/`all`/etc., não a semântica "deixa
 * os filhos reagirem mas não o próprio container" ou vice-versa) —
 * aproximado: `box-none`→`none` (comportamento mais próximo da intenção:
 * não bloquear cliques por trás do overlay) e `box-only`→`auto`.
 */
import type { CSSProperties } from 'react';
import { resolveThemeColor, resolveThemeAsset, combineStyles } from './utils';
import type { ThemeComponentProps, ThemeOverlayVariant } from './types';

export interface ThemeOverlayProps extends ThemeComponentProps {
  variant?: ThemeOverlayVariant;
  opacity?: number;
  useImageEffect?: boolean;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  fullscreen?: boolean;
}

export function ThemeOverlay({
  theme,
  variant = 'dim',
  opacity,
  useImageEffect = true,
  pointerEvents = 'auto',
  fullscreen = true,
  style,
  children,
  testID,
  accessibilityLabel,
}: ThemeOverlayProps) {
  let bgColor = 'rgba(0, 0, 0, 0.5)';
  let zIndex = 10;

  if (theme.zIndex) {
    if (variant === 'modal' || variant === 'loading') {
      zIndex = theme.zIndex.overlay ?? 10;
    } else if (variant === 'celebration' || variant === 'winner') {
      zIndex = theme.zIndex.winner ?? 30;
    } else if (variant === 'scrim') {
      zIndex = theme.zIndex.overlay ?? 10;
    }
  }

  if (variant === 'scrim') {
    bgColor = resolveThemeColor(theme, 'scrim', 'rgba(0, 0, 0, 0.85)');
  } else if (variant === 'dim') {
    bgColor = resolveThemeColor(theme, 'overlay', 'rgba(0, 0, 0, 0.6)');
  } else if (variant === 'modal') {
    bgColor = resolveThemeColor(theme, 'overlay', 'rgba(4, 8, 38, 0.75)');
  } else if (variant === 'winner' || variant === 'celebration') {
    bgColor = 'rgba(0, 0, 0, 0.4)';
  }

  const finalOpacity = opacity ?? 1.0;

  let effectImage: string | null = null;
  if (useImageEffect && theme.assets && (variant === 'winner' || variant === 'celebration')) {
    effectImage = resolveThemeAsset(theme, 'effects', 'effectLightBurst') || resolveThemeAsset(theme, 'effects', 'effectBloom');
  }

  const cssPointerEvents: CSSProperties['pointerEvents'] =
    pointerEvents === 'box-none' ? 'none' : pointerEvents === 'box-only' ? 'auto' : pointerEvents;

  const overlayStyle = combineStyles<CSSProperties>(
    fullscreen
      ? { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }
      : { position: 'absolute', inset: 0 },
    {
      backgroundColor: bgColor,
      opacity: finalOpacity,
      zIndex,
      pointerEvents: cssPointerEvents,
    },
    style,
  );

  return (
    <div style={overlayStyle} data-testid={testID} aria-label={accessibilityLabel}>
      {effectImage && (
        // eslint-disable-next-line @next/next/no-img-element -- porte 1:1, efeito decorativo
        <img
          src={effectImage}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }}
        />
      )}
      {children}
    </div>
  );
}

export default ThemeOverlay;
