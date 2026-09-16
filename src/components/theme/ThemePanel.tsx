'use client';

/**
 * ThemePanel.tsx — porte de `tvapp1/src/components/theme/ThemePanel.tsx`.
 *
 * `ImageBackground resizeMode="stretch"` → `div` com `backgroundImage` +
 * `backgroundSize: '100% 100%'` (equivalente exato de "esticar para caber
 * exatamente", sem preservar aspect ratio — é isso que `stretch` faz no RN).
 */
import type { CSSProperties } from 'react';
import { resolveThemeColor, resolveThemeAsset, resolveThemeRadius, combineStyles, getTvFocusStyles } from './utils';
import type { ThemeComponentProps, ThemePanelVariant, ThemeState } from './types';

export interface ThemePanelProps extends ThemeComponentProps, ThemeState {
  variant?: ThemePanelVariant;
  padding?: number;
  borderRadius?: number;
  useImageBg?: boolean;
}

export function ThemePanel({
  theme,
  variant = 'default',
  focused = false,
  padding,
  borderRadius,
  useImageBg = true,
  style,
  children,
  testID,
  accessibilityLabel,
}: ThemePanelProps) {
  let panelBgColor = resolveThemeColor(theme, 'panelBg', 'rgba(255,255,255,0.05)');
  let borderCol = resolveThemeColor(theme, 'borderSecondary', 'rgba(255,255,255,0.1)');
  let borderWidth = 1.5;

  if (variant === 'glass') {
    panelBgColor = resolveThemeColor(theme, 'glassBg', 'rgba(0,0,0,0.3)');
    borderCol = resolveThemeColor(theme, 'borderMuted', 'rgba(255,255,255,0.05)');
  } else if (variant === 'dark') {
    panelBgColor = resolveThemeColor(theme, 'backgroundDeep', '#020412');
  } else if (variant === 'gold') {
    borderCol = resolveThemeColor(theme, 'borderPrimary', '#ffde38');
    borderWidth = 2;
  } else if (variant === 'blue') {
    borderCol = resolveThemeColor(theme, 'borderSecondary', '#4868ff');
    borderWidth = 2;
  } else if (variant === 'header') {
    panelBgColor = theme.headerBg || 'rgba(0,0,0,0.3)';
    borderWidth = 0;
  } else if (variant === 'footer') {
    panelBgColor = 'rgba(0,0,0,0.5)';
    borderWidth = 0;
  }

  const finalRadius = borderRadius ?? resolveThemeRadius(theme, 'medium', 12);
  const finalPadding = padding ?? 12;

  const tvFocus = getTvFocusStyles(theme, focused);

  let imageSource: string | null = null;
  if (useImageBg && theme.assets) {
    switch (variant) {
      case 'glass':
        imageSource = resolveThemeAsset(theme, 'panels', 'panelGlass');
        break;
      case 'dark':
        imageSource = resolveThemeAsset(theme, 'panels', 'panelDark');
        break;
      case 'modal':
        imageSource = resolveThemeAsset(theme, 'panels', 'panelModal');
        break;
      case 'header':
        imageSource = resolveThemeAsset(theme, 'panels', 'panelHeader');
        break;
      case 'footer':
        imageSource = resolveThemeAsset(theme, 'panels', 'panelFooter');
        break;
      case 'ranking':
        imageSource =
          resolveThemeAsset(theme, 'cards', 'cardRanking') || resolveThemeAsset(theme, 'panels', 'panelSidebar');
        break;
      case 'ticket':
        imageSource =
          resolveThemeAsset(theme, 'cards', 'cardTicket') || resolveThemeAsset(theme, 'panels', 'panelMain');
        break;
      case 'default':
      default:
        imageSource = resolveThemeAsset(theme, 'panels', 'panelMain');
        break;
    }
  }

  const innerStyle = combineStyles<CSSProperties>(
    { overflow: 'hidden', boxSizing: 'border-box' },
    {
      backgroundColor: imageSource ? 'transparent' : panelBgColor,
      backgroundImage: imageSource ? `url(${imageSource})` : undefined,
      backgroundSize: imageSource ? '100% 100%' : undefined,
      borderColor: borderCol,
      borderStyle: 'solid',
      borderWidth: imageSource ? 0 : borderWidth,
      borderRadius: finalRadius,
      padding: finalPadding,
      opacity: 1.0,
    },
    tvFocus.style,
    style,
  );

  return (
    <div
      style={{ transform: `scale(${tvFocus.scale})`, transition: 'transform 150ms ease' }}
      data-testid={testID}
      aria-label={accessibilityLabel}
    >
      <div style={innerStyle}>{children}</div>
    </div>
  );
}

export default ThemePanel;
