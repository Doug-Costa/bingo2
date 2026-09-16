'use client';

/**
 * TvFocusable.tsx — porte de `tvapp1/src/components/theme/TvFocusable.tsx`.
 *
 * `Animated.timing` (escala ao focar) → CSS `transition: transform`.
 * `hasTVPreferredFocus` → `autoFocus`. `nextFocusUp/Down/Left/Right` —
 * grafo de foco espacial do D-pad Android TV, sem equivalente web (não há
 * API padrão de navegação espacial por controle remoto no browser) —
 * aceitos na assinatura por paridade, mas no-op nesta rodada: controle
 * remoto fica fora do escopo desta migração (confirmado com o usuário),
 * a navegação aqui é só a ordem natural de Tab/click.
 */
import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { getTvFocusStyles, combineStyles } from './utils';
import type { ThemeComponentProps } from './types';

export interface TvFocusableProps extends ThemeComponentProps {
  focusable?: boolean;
  hasTVPreferredFocus?: boolean;
  /** @deprecated grafo de foco D-pad — sem efeito na web, ver nota acima. */
  nextFocusUp?: number;
  /** @deprecated idem. */
  nextFocusDown?: number;
  /** @deprecated idem. */
  nextFocusLeft?: number;
  /** @deprecated idem. */
  nextFocusRight?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  focusedStyle?: CSSProperties;
  selectedStyle?: CSSProperties;
  pressedStyle?: CSSProperties;
  accessibilityRole?: string;
}

export function TvFocusable({
  theme,
  focusable = true,
  hasTVPreferredFocus = false,
  onFocus,
  onBlur,
  onPress,
  disabled = false,
  selected = false,
  focusedStyle,
  selectedStyle,
  pressedStyle,
  style,
  children,
  testID,
  accessibilityLabel,
}: TvFocusableProps) {
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);

  const tvFocus = getTvFocusStyles(theme, focused, pressed);

  const handleFocus = () => {
    setFocused(true);
    onFocus?.();
  };
  const handleBlur = () => {
    setFocused(false);
    setPressed(false);
    onBlur?.();
  };

  const containerStyle = combineStyles<CSSProperties>(
    { overflow: 'hidden' },
    { opacity: disabled ? theme.focusState?.disabledOpacity ?? 0.5 : 1.0 },
    focused ? focusedStyle : undefined,
    focused ? tvFocus.style : undefined,
    selected ? selectedStyle : undefined,
    pressed ? pressedStyle : undefined,
    style,
    {
      transform: `scale(${tvFocus.scale})`,
      transition: 'transform 150ms ease',
      boxShadow: tvFocus.shadow ?? tvFocus.glow,
    },
  );

  return (
    <button
      type="button"
      tabIndex={focusable && !disabled ? 0 : -1}
      disabled={disabled}
      onFocus={disabled ? undefined : handleFocus}
      onBlur={disabled ? undefined : handleBlur}
      onClick={disabled ? undefined : onPress}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => !disabled && setPressed(false)}
      autoFocus={hasTVPreferredFocus}
      data-testid={testID}
      aria-label={accessibilityLabel}
      aria-pressed={selected}
      style={{ border: 'none', background: 'none', padding: 0, textAlign: 'inherit', cursor: disabled ? 'default' : 'pointer' }}
    >
      <div style={containerStyle}>{children as ReactNode}</div>
    </button>
  );
}

export default TvFocusable;
