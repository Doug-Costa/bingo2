/**
 * types.ts — porte de `tvapp1/src/components/theme/types.ts`.
 *
 * `StyleProp<ViewStyle|TextStyle|ImageStyle>` (RN) → `React.CSSProperties`
 * (web). `ThemeImageSource` era `number | {uri:string}` no RN (id de módulo
 * `require()` ou URL remota) — na web os assets locais já são strings de
 * path (`theme/assets.ts`), então vira só `string`.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { ThemeTokens } from '@/theme/themes';

export interface ThemeComponentProps {
  theme: ThemeTokens;
  style?: CSSProperties;
  children?: ReactNode;
  testID?: string;
  accessibilityLabel?: string;
}

export interface ThemeState {
  focused?: boolean;
  selected?: boolean;
  disabled?: boolean;
  pressed?: boolean;
}

export type ThemeSize = 'small' | 'medium' | 'large';

export type ThemeImageSource = string;

export type ThemePanelVariant =
  | 'default'
  | 'glass'
  | 'gold'
  | 'blue'
  | 'dark'
  | 'header'
  | 'footer'
  | 'modal'
  | 'ranking'
  | 'ticket';

export type ThemeCardVariant =
  | 'default'
  | 'winner'
  | 'ranking'
  | 'ticket'
  | 'config'
  | 'info'
  | 'promo';

export type ThemeButtonVariant =
  | 'primary'
  | 'secondary'
  | 'gold'
  | 'blue'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'config';

export type ThemeTextVariant =
  | 'displayLarge'
  | 'displayMedium'
  | 'titleLarge'
  | 'titleMedium'
  | 'titleSmall'
  | 'bodyLarge'
  | 'bodyMedium'
  | 'bodySmall'
  | 'labelLarge'
  | 'labelMedium'
  | 'labelSmall'
  | 'numberLarge'
  | 'numberMedium'
  | 'numberSmall'
  | 'digital'
  | 'winner'
  | 'ranking'
  | 'ticket';

export type ThemeLogoSize = 'small' | 'medium' | 'large' | 'hero';

export type ThemeLogoVariant = 'primary' | 'compact' | 'monochrome' | 'gold' | 'blue';

export type ThemeGlowVariant = 'gold' | 'blue' | 'winner' | 'focus' | 'soft';

export type ThemeDividerVariant = 'gold' | 'blue' | 'glass' | 'muted';

export type ThemeOverlayVariant = 'modal' | 'loading' | 'celebration' | 'winner' | 'dim' | 'scrim';

export type ThemeBadgeVariant =
  | 'default'
  | 'gold'
  | 'blue'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'winner';

export interface TvFocusState {
  focusScale?: number;
  focusOpacity?: number;
  focusBorderColor?: string;
  focusBorderWidth?: number;
  focusBackground?: string;
  focusShadow?: CSSProperties;
  focusGlow?: CSSProperties;
  pressedScale?: number;
  disabledOpacity?: number;
}
