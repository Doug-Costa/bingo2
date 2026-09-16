'use client';

/** ThemeBadge.tsx — porte de `tvapp1/src/components/theme/ThemeBadge.tsx`. */
import type { CSSProperties } from 'react';
import { resolveThemeColor, combineStyles } from './utils';
import { ThemeText } from './ThemeText';
import Icon, { type IconName } from '../Icon';
import type { ThemeComponentProps, ThemeBadgeVariant, ThemeSize, ThemeTextVariant } from './types';

export interface ThemeBadgeProps extends ThemeComponentProps {
  variant?: ThemeBadgeVariant;
  size?: ThemeSize;
  title: string;
  iconName?: IconName;
  iconSize?: number;
  selected?: boolean;
  focused?: boolean;
  disabled?: boolean;
}

export function ThemeBadge({
  theme,
  variant = 'default',
  size = 'medium',
  title,
  iconName,
  iconSize,
  selected = false,
  focused = false,
  disabled = false,
  style,
  testID,
  accessibilityLabel,
}: ThemeBadgeProps) {
  let paddingVertical = 4;
  let paddingHorizontal = 10;
  let textVariant: ThemeTextVariant = 'labelSmall';
  let defaultIconSize = 10;
  let borderRadius = 10;

  if (size === 'small') {
    paddingVertical = 2;
    paddingHorizontal = 6;
    defaultIconSize = 8;
    borderRadius = 6;
  } else if (size === 'large') {
    paddingVertical = 6;
    paddingHorizontal = 14;
    textVariant = 'labelMedium';
    defaultIconSize = 12;
    borderRadius = 14;
  }

  let bgColor = 'rgba(255, 255, 255, 0.1)';
  let borderCol = 'rgba(255, 255, 255, 0.15)';
  let textCol = 'textPrimary';

  if (variant === 'gold' || selected) {
    bgColor = resolveThemeColor(theme, 'goldPrimary', '#ffde38');
    borderCol = resolveThemeColor(theme, 'borderPrimary', '#ffde38');
    textCol = 'textOnGold';
  } else if (variant === 'blue') {
    bgColor = resolveThemeColor(theme, 'blueSecondary', '#1333f0');
    borderCol = resolveThemeColor(theme, 'borderSecondary', '#4868ff');
  } else if (variant === 'success') {
    bgColor = resolveThemeColor(theme, 'success', '#00d54f');
    borderCol = resolveThemeColor(theme, 'success', '#00d54f');
  } else if (variant === 'warning') {
    bgColor = resolveThemeColor(theme, 'warning', '#ffde38');
    borderCol = resolveThemeColor(theme, 'warning', '#ffde38');
    textCol = 'textOnGold';
  } else if (variant === 'error') {
    bgColor = resolveThemeColor(theme, 'error', '#ff1f1f');
    borderCol = resolveThemeColor(theme, 'error', '#ff1f1f');
  } else if (variant === 'info') {
    bgColor = resolveThemeColor(theme, 'info', '#7ea0ff');
    borderCol = resolveThemeColor(theme, 'info', '#7ea0ff');
  } else if (variant === 'winner') {
    bgColor = resolveThemeColor(theme, 'success', '#00d54f');
    borderCol = resolveThemeColor(theme, 'borderPrimary', '#ffde38');
  }

  if (focused) {
    borderCol = resolveThemeColor(theme, 'focus', '#ffde38');
  }

  const containerStyle = combineStyles<CSSProperties>(
    {
      display: 'inline-flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      alignSelf: 'flex-start',
    },
    {
      backgroundColor: bgColor,
      borderColor: borderCol,
      borderStyle: 'solid',
      borderWidth: 1,
      borderRadius,
      paddingTop: paddingVertical,
      paddingBottom: paddingVertical,
      paddingLeft: paddingHorizontal,
      paddingRight: paddingHorizontal,
      opacity: disabled ? 0.5 : 1.0,
    },
    style,
  );

  return (
    <div style={containerStyle} data-testid={testID} aria-label={accessibilityLabel || title}>
      {iconName && <Icon name={iconName} size={iconSize ?? defaultIconSize} color={resolveThemeColor(theme, textCol, '#ffffff')} />}
      <ThemeText theme={theme} variant={textVariant} color={textCol} textStyle={{ fontWeight: 900 }}>
        {title}
      </ThemeText>
    </div>
  );
}

export default ThemeBadge;
