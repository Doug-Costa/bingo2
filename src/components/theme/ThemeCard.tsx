'use client';

/**
 * ThemeCard.tsx — porte de `tvapp1/src/components/theme/ThemeCard.tsx`.
 *
 * `Pressable` (quando `onPress` é passado) → `<button>` nativo (foco/click/
 * teclado de graça); sem `onPress` vira `<div>`, igual ao RN.
 */
import type { CSSProperties } from 'react';
import { resolveThemeColor, resolveThemeAsset, resolveThemeRadius, combineStyles, getTvFocusStyles } from './utils';
import type { ThemeComponentProps, ThemeCardVariant, ThemeState } from './types';

export interface ThemeCardProps extends ThemeComponentProps, ThemeState {
  variant?: ThemeCardVariant;
  padding?: number;
  borderRadius?: number;
  onPress?: () => void;
  useImageBg?: boolean;
}

export function ThemeCard({
  theme,
  variant = 'default',
  focused = false,
  selected = false,
  disabled = false,
  pressed = false,
  padding,
  borderRadius,
  onPress,
  useImageBg = true,
  style,
  children,
  testID,
  accessibilityLabel,
}: ThemeCardProps) {
  let cardBgColor = resolveThemeColor(theme, 'surfacePrimary', 'rgba(255,255,255,0.08)');
  let borderCol = resolveThemeColor(theme, 'borderSecondary', 'rgba(255,255,255,0.15)');
  let borderWidth = 1;

  if (variant === 'winner') {
    borderCol = resolveThemeColor(theme, 'borderPrimary', '#ffde38');
    borderWidth = 2;
  } else if (variant === 'config' || variant === 'info') {
    cardBgColor = resolveThemeColor(theme, 'surfaceSecondary', '#121f8a');
  }

  const finalRadius = borderRadius ?? resolveThemeRadius(theme, 'small', 8);
  const finalPadding = padding ?? 10;

  const tvFocus = getTvFocusStyles(theme, focused, pressed);

  let imageSource: string | null = null;
  if (useImageBg && theme.assets) {
    switch (variant) {
      case 'ticket':
        imageSource = resolveThemeAsset(theme, 'cards', 'cardTicket');
        break;
      case 'ranking':
        imageSource = resolveThemeAsset(theme, 'cards', 'cardRanking');
        break;
      case 'info':
      case 'config':
        imageSource = resolveThemeAsset(theme, 'cards', 'cardInfo');
        break;
      case 'promo':
        imageSource = resolveThemeAsset(theme, 'cards', 'cardPrize') || resolveThemeAsset(theme, 'cards', 'cardSection');
        break;
      case 'default':
      default:
        imageSource = resolveThemeAsset(theme, 'cards', 'cardPlayer');
        break;
    }
  }

  const innerStyle = combineStyles<CSSProperties>(
    { overflow: 'hidden', boxSizing: 'border-box' },
    {
      backgroundColor: imageSource ? 'transparent' : cardBgColor,
      backgroundImage: imageSource ? `url(${imageSource})` : undefined,
      backgroundSize: imageSource ? '100% 100%' : undefined,
      borderColor: borderCol,
      borderStyle: 'solid',
      borderWidth: imageSource ? 0 : borderWidth,
      borderRadius: finalRadius,
      padding: finalPadding,
      opacity: disabled ? 0.5 : 1.0,
    },
    tvFocus.style,
    style,
  );

  const containerStyle: CSSProperties = {
    transform: `scale(${tvFocus.scale})`,
    transition: 'transform 150ms ease',
  };

  const content = <div style={innerStyle}>{children}</div>;

  if (onPress) {
    return (
      <button
        type="button"
        onClick={disabled ? undefined : onPress}
        disabled={disabled}
        style={{ ...containerStyle, border: 'none', background: 'none', padding: 0, textAlign: 'inherit', cursor: disabled ? 'default' : 'pointer' }}
        data-testid={testID}
        aria-label={accessibilityLabel}
        aria-pressed={selected}
      >
        {content}
      </button>
    );
  }

  return (
    <div style={containerStyle} data-testid={testID} aria-label={accessibilityLabel}>
      {content}
    </div>
  );
}

export default ThemeCard;
