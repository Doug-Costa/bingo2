'use client';

/**
 * ThemeBackground.tsx — porte de `tvapp1/src/components/theme/ThemeBackground.tsx`.
 *
 * `LinearGradient` → CSS `linear-gradient()`. Textura com `resizeMode="repeat"`
 * (RN) → `background-repeat: repeat` via `backgroundImage` em vez de `<img>`
 * (sem equivalente de "resizeMode" para `<img>` no CSS). As 4 camadas
 * empilhadas (imagem → gradiente → textura → overlay) preservam a mesma
 * ordem/opacidade do original.
 */
import type { CSSProperties, ReactNode } from 'react';
import { resolveThemeColor, resolveThemeAsset } from './utils';
import { getThemeKey, TEMA_GRADIENTS } from '@/theme/themes';
import type { ThemeComponentProps } from './types';

export interface ThemeBackgroundProps extends ThemeComponentProps {
  variant?: 'main' | 'dark' | 'config' | 'lock' | 'modal' | 'winner';
  resizeMode?: 'cover' | 'contain' | 'stretch';
  imageOpacity?: number;
  showTexture?: boolean;
  showOverlay?: boolean;
  overlayOpacity?: number;
}

const absoluteFill: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
};

export function ThemeBackground({
  theme,
  variant = 'main',
  resizeMode = 'cover',
  imageOpacity = 1.0,
  showTexture = true,
  showOverlay = false,
  overlayOpacity = 0.5,
  style,
  children,
  testID,
  accessibilityLabel,
}: ThemeBackgroundProps) {
  const themeKey = getThemeKey(theme);

  let bgColor = resolveThemeColor(theme, 'backgroundPrimary', '#000000');
  if (variant === 'dark' || variant === 'modal') {
    bgColor = resolveThemeColor(theme, 'backgroundDeep', '#000000');
  }

  let bgImageSource: string | null = null;
  if (theme.assets) {
    if (variant === 'main' || variant === 'winner') {
      bgImageSource =
        resolveThemeAsset(theme, 'backgrounds', 'bgMain') ||
        resolveThemeAsset(theme, 'backgrounds', 'bgSpace');
    } else if (variant === 'dark' || variant === 'config' || variant === 'lock' || variant === 'modal') {
      bgImageSource =
        resolveThemeAsset(theme, 'backgrounds', 'bgDark') ||
        resolveThemeAsset(theme, 'backgrounds', 'bgMain');
    }
  }

  let gradientColors: readonly string[] = [];
  const gradients = TEMA_GRADIENTS[themeKey];
  if (gradients?.bg) {
    gradientColors = gradients.bg;
  } else if (theme.gradients?.mainBackground) {
    gradientColors = theme.gradients.mainBackground;
  }
  if (variant === 'dark' && theme.gradients?.darkBackground) {
    gradientColors = theme.gradients.darkBackground;
  }

  let textureSource: string | null = null;
  if (showTexture && theme.assets) {
    textureSource =
      resolveThemeAsset(theme, 'textures', 'textureSpace') ||
      resolveThemeAsset(theme, 'textures', 'textureNoise');
  }

  const needsOverlay = showOverlay || variant === 'modal' || variant === 'winner';
  const overlayColor = variant === 'winner' ? 'rgba(0, 0, 0, 0.3)' : `rgba(0, 0, 0, ${overlayOpacity})`;

  const objectFit: CSSProperties['objectFit'] =
    resizeMode === 'stretch' ? 'fill' : resizeMode === 'contain' ? 'contain' : 'cover';

  return (
    <div
      style={{ position: 'relative', flex: 1, overflow: 'hidden', ...style }}
      data-testid={testID}
      aria-label={accessibilityLabel}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundColor: bgColor }} />

      {/* Camada 1: Imagem de Fundo PNG */}
      {bgImageSource && (
        // eslint-disable-next-line @next/next/no-img-element -- porte 1:1 do RN, imagem de tema dinâmica (não estática do bundle Next)
        <img
          src={bgImageSource}
          alt=""
          style={{ ...absoluteFill, opacity: imageOpacity, objectFit }}
        />
      )}

      {/* Camada 2: Gradiente do Tema */}
      {gradientColors.length > 1 && (
        <div
          style={{
            ...absoluteFill,
            opacity: bgImageSource ? 0.8 : 1.0,
            background: `linear-gradient(to bottom, ${gradientColors.join(', ')})`,
          }}
        />
      )}

      {/* Camada 3: Textura (background-repeat, equivalente ao resizeMode="repeat" do RN) */}
      {textureSource && (
        <div
          style={{
            ...absoluteFill,
            opacity: 0.15,
            backgroundImage: `url(${textureSource})`,
            backgroundRepeat: 'repeat',
          }}
        />
      )}

      {/* Camada 4: Overlay */}
      {needsOverlay && <div style={{ ...absoluteFill, backgroundColor: overlayColor }} />}

      {/* Conteúdo */}
      <div style={{ position: 'relative', flex: 1, height: '100%' }}>
        {children as ReactNode}
      </div>
    </div>
  );
}

export default ThemeBackground;
