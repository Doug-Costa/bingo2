'use client';

/**
 * ThemeButton.tsx — porte de `tvapp1/src/components/theme/ThemeButton.tsx`.
 *
 * `Pressable` → `<button>` nativo. `hasTVPreferredFocus` → `autoFocus`.
 * `onFocus/onBlur/onPressIn/onPressOut` → eventos DOM equivalentes
 * (`onFocus/onBlur/onMouseDown/onMouseUp`, mais `onKeyDown`/`onKeyUp` para
 * Enter/Espaço via controle remoto/teclado). `LinearGradient` → CSS
 * `linear-gradient()` como `background`.
 */
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { resolveThemeColor, combineStyles, getTvFocusStyles } from './utils';
import { ThemeText } from './ThemeText';
import Icon, { type IconName } from '../Icon';
import type { ThemeComponentProps, ThemeButtonVariant, ThemeSize, ThemeTextVariant } from './types';

export interface ThemeButtonProps extends ThemeComponentProps {
  variant?: ThemeButtonVariant;
  size?: ThemeSize;
  title: string;
  onPress: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  loading?: boolean;
  iconName?: IconName;
  iconSize?: number;
  hasTVPreferredFocus?: boolean;
}

export function ThemeButton({
  theme,
  variant = 'primary',
  size = 'medium',
  title,
  onPress,
  onFocus,
  onBlur,
  disabled = false,
  loading = false,
  iconName,
  iconSize,
  hasTVPreferredFocus = false,
  style,
  testID,
  accessibilityLabel,
}: ThemeButtonProps) {
  const [internalFocused, setInternalFocused] = useState(false);
  const [internalPressed, setInternalPressed] = useState(false);

  let height = 48;
  let paddingHorizontal = 20;
  let textVariant: ThemeTextVariant = 'labelMedium';
  let defaultIconSize = 16;

  if (size === 'small') {
    height = 36;
    paddingHorizontal = 12;
    textVariant = 'labelSmall';
    defaultIconSize = 14;
  } else if (size === 'large') {
    height = 56;
    paddingHorizontal = 28;
    textVariant = 'labelLarge';
    defaultIconSize = 20;
  }

  let btnBgColor = resolveThemeColor(theme, 'surfaceSecondary', '#121f8a');
  let borderCol = 'transparent';
  let borderWidth = 0;
  let textCol = 'textPrimary';
  let gradientColors: readonly string[] | null = null;

  if (theme.gradients) {
    if (variant === 'primary') {
      gradientColors = theme.gradients.buttonPrimary;
      textCol = 'textOnGold';
    } else if (variant === 'secondary') {
      gradientColors = theme.gradients.buttonSecondary;
      textCol = 'textPrimary';
    } else if (variant === 'gold') {
      gradientColors = theme.gradients.gold;
      textCol = 'textOnGold';
    } else if (variant === 'blue') {
      gradientColors = theme.gradients.blue;
      textCol = 'textPrimary';
    }
  }

  if (!gradientColors) {
    if (variant === 'primary' || variant === 'gold') {
      btnBgColor = theme.primary || '#ffde38';
      textCol = 'textOnGold';
    } else if (variant === 'secondary' || variant === 'blue') {
      btnBgColor = theme.secondary || '#4868ff';
      textCol = 'textPrimary';
    } else if (variant === 'danger') {
      btnBgColor = theme.error || '#ff1f1f';
      textCol = 'textPrimary';
    } else if (variant === 'success') {
      btnBgColor = theme.success || '#00d54f';
      textCol = 'textOnGold';
    } else if (variant === 'ghost') {
      btnBgColor = 'transparent';
      borderCol = theme.borderSecondary || '#4868ff';
      borderWidth = 1.5;
      textCol = 'textPrimary';
    }
  }

  if (disabled) {
    btnBgColor = 'rgba(255, 255, 255, 0.15)';
    gradientColors = null;
    textCol = 'textMuted';
  }

  const tvFocus = getTvFocusStyles(theme, internalFocused, internalPressed);

  const handleFocus = () => {
    setInternalFocused(true);
    onFocus?.();
  };
  const handleBlur = () => {
    setInternalFocused(false);
    setInternalPressed(false);
    onBlur?.();
  };

  const buttonStyle = combineStyles<CSSProperties>(
    {
      display: 'inline-flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      gap: 8,
      cursor: disabled || loading ? 'default' : 'pointer',
      border: 'none',
    },
    {
      height,
      paddingLeft: paddingHorizontal,
      paddingRight: paddingHorizontal,
      background: gradientColors
        ? `linear-gradient(90deg, ${gradientColors.join(', ')})`
        : btnBgColor,
      borderColor: borderCol,
      borderStyle: 'solid',
      borderWidth,
      borderRadius: height / 2,
      opacity: disabled ? 0.5 : 1.0,
      transform: `scale(${tvFocus.scale})`,
      transition: 'transform 150ms ease',
      boxShadow: tvFocus.shadow,
    },
    tvFocus.style,
    style,
  );

  const loaderColor = textCol === 'textOnGold' ? '#000000' : '#ffffff';

  return (
    <button
      type="button"
      onClick={disabled || loading ? undefined : onPress}
      onFocus={disabled ? undefined : handleFocus}
      onBlur={disabled ? undefined : handleBlur}
      onMouseDown={() => !disabled && setInternalPressed(true)}
      onMouseUp={() => !disabled && setInternalPressed(false)}
      disabled={disabled}
      autoFocus={hasTVPreferredFocus}
      style={buttonStyle}
      data-testid={testID}
      aria-label={accessibilityLabel}
      aria-busy={loading}
    >
      {loading ? (
        <span
          aria-hidden
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: `2px solid ${loaderColor}`,
            borderTopColor: 'transparent',
            animation: 'bs-spin 0.7s linear infinite',
          }}
        />
      ) : (
        <>
          {iconName && <Icon name={iconName} size={iconSize ?? defaultIconSize} color={resolveThemeColor(theme, textCol, '#ffffff')} />}
          <ThemeText theme={theme} variant={textVariant} color={textCol} textStyle={{ fontWeight: 900 }}>
            {title}
          </ThemeText>
        </>
      )}
    </button>
  );
}

export default ThemeButton;
