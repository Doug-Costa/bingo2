/**
 * utils.ts — porte de `tvapp1/src/components/theme/utils.ts`.
 *
 * `StyleSheet.flatten` (RN) → merge simples de objetos (`Object.assign`) —
 * CSS-in-JS não precisa de achatamento especial, `style` já é só um objeto.
 * `resolveThemeAsset` retorna `string | null` em vez de `any | null` — os
 * assets locais na web já são paths estáticos (`theme/assets.ts`), não IDs
 * opacos de módulo.
 */
import type { CSSProperties } from 'react';
import type { ThemeTokens } from '@/theme/themes';

export function combineStyles<T extends object>(
  ...styles: (T | CSSProperties | undefined | false | null)[]
): T {
  return Object.assign({}, ...styles.filter(Boolean)) as T;
}

/**
 * Retorna uma cor segura do tema com base nas chaves de cores estendidas,
 * caindo de volta nos tokens flats originais para compatibilidade.
 */
export function resolveThemeColor(
  theme: ThemeTokens,
  colorKey: string,
  fallbackColor: string = '#ffffff',
): string {
  if (theme.colorsExtended && colorKey in theme.colorsExtended) {
    return (theme.colorsExtended as Record<string, string>)[colorKey] ?? fallbackColor;
  }

  switch (colorKey) {
    case 'backgroundPrimary':
    case 'backgroundSecondary':
    case 'backgroundDeep':
      return theme.bgColor;
    case 'surfacePrimary':
    case 'surfaceSecondary':
    case 'surfaceElevated':
      return theme.panelBg;
    case 'surfaceGlass':
      return theme.glassBg || theme.panelBg;
    case 'goldPrimary':
    case 'goldSecondary':
    case 'goldLight':
      return theme.primary;
    case 'bluePrimary':
    case 'blueSecondary':
    case 'blueNeon':
      return theme.secondary;
    case 'textPrimary':
      return theme.textPrimary;
    case 'textSecondary':
      return theme.textSecondary;
    case 'textMuted':
      return theme.textMuted;
    case 'textOnGold':
      return theme.ballText || '#000000';
    case 'success':
      return theme.success;
    case 'warning':
      return theme.primary;
    case 'error':
      return theme.error;
    case 'info':
      return theme.secondary || '#3b82f6';
    case 'borderPrimary':
      return theme.borderPrimary;
    case 'borderSecondary':
      return theme.borderSecondary;
    case 'borderMuted':
      return theme.borderMuted;
    case 'focus':
      return theme.primary;
    default:
      return fallbackColor;
  }
}

/** Valida e recupera um asset estático (path de imagem) mapeado no tema. */
export function resolveThemeAsset(
  theme: ThemeTokens,
  category: string,
  assetKey: string,
): string | null {
  const categoryAssets = theme.assets && (theme.assets as Record<string, Record<string, string>>)[category];
  if (categoryAssets && assetKey in categoryAssets) {
    return categoryAssets[assetKey] ?? null;
  }
  return null;
}

export function resolveThemeSpacing(theme: ThemeTokens, spacingKey: string, fallbackVal: number): number {
  if (theme.spacing && spacingKey in theme.spacing) {
    return (theme.spacing as unknown as Record<string, number>)[spacingKey] ?? fallbackVal;
  }
  return fallbackVal;
}

export function resolveThemeRadius(theme: ThemeTokens, radiusKey: string, fallbackVal: number): number {
  if (theme.radius && radiusKey in theme.radius) {
    return (theme.radius as unknown as Record<string, number>)[radiusKey] ?? fallbackVal;
  }
  return fallbackVal;
}

interface RnShadowLike {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
}

/**
 * shadowToCssBoxShadow — tradução mecânica do modelo RN
 * (`shadowColor/shadowOffset/shadowOpacity/shadowRadius`, `elevation`
 * ignorado — é um shadow Android-only sem equivalente web) para CSS
 * `box-shadow`. Mesma técnica já usada em `features/bingo-show/design-system/shadows.ts`
 * (Fase 1), reimplementada aqui para manter os dois sistemas de tema
 * independentes (ver `docs/migration-map-tvscreen.md`).
 */
export function shadowToCssBoxShadow(shadow: RnShadowLike | undefined | null): string | undefined {
  if (!shadow || !shadow.shadowColor || shadow.shadowOpacity === 0) {
    return undefined;
  }
  const { shadowColor, shadowOffset = { width: 0, height: 0 }, shadowOpacity = 1, shadowRadius = 0 } = shadow;
  const alphaPct = Math.round(shadowOpacity * 100);
  const color = `color-mix(in srgb, ${shadowColor} ${alphaPct}%, transparent)`;
  return `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px ${color}`;
}

export interface TvFocusResult {
  scale: number;
  style: CSSProperties;
  shadow?: string;
  glow?: string;
}

/** Gera as propriedades visuais de foco e escala amigáveis ao controle remoto. */
export function getTvFocusStyles(
  theme: ThemeTokens,
  focused: boolean,
  pressed: boolean = false,
): TvFocusResult {
  const fs = theme.focusState;

  if (!fs) {
    return {
      scale: pressed ? 0.98 : focused ? 1.03 : 1.0,
      style: focused
        ? {
            borderColor: theme.borderPrimary,
            borderWidth: 2,
          }
        : {},
    };
  }

  const scale = pressed ? fs.pressedScale || 0.98 : focused ? fs.focusScale || 1.05 : 1.0;
  const focusStyle: CSSProperties = focused
    ? {
        borderColor: fs.focusBorderColor || theme.borderPrimary,
        borderWidth: fs.focusBorderWidth || 3,
        backgroundColor: fs.focusBackground,
      }
    : {};

  return {
    scale,
    style: focusStyle,
    shadow: focused ? shadowToCssBoxShadow(fs.focusShadow as RnShadowLike) : undefined,
    glow: focused ? shadowToCssBoxShadow(fs.focusGlow as RnShadowLike) : undefined,
  };
}
