'use client';

/**
 * ThemeLogo.tsx — porte de `tvapp1/src/components/theme/ThemeLogo.tsx`.
 *
 * Simplificação de escopo (só tema04): `theme.meta.id === 'theme-bingo-show'`
 * é SEMPRE verdadeiro para `temaBingoShow` — o branch "modo legado" (texto
 * "BINGO SHOW" com gradiente, usado por tema01/02/03) nunca executava para
 * o tema migrado; removido. Só o branch `LogoGold` (SVG) permanece.
 */
import { LogoGold } from './svg/LogoGold';
import type { ThemeComponentProps, ThemeLogoSize } from './types';

export interface ThemeLogoProps extends ThemeComponentProps {
  size?: ThemeLogoSize;
}

export function ThemeLogo({ size = 'medium', style, testID, accessibilityLabel }: ThemeLogoProps) {
  let width = 160;
  let height = 64;

  if (size === 'small') {
    width = 110;
    height = 44;
  } else if (size === 'large') {
    width = 240;
    height = 96;
  } else if (size === 'hero') {
    width = 320;
    height = 128;
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', width, height, ...style }}
      data-testid={testID}
      aria-label={accessibilityLabel || 'Logo Bingo Show'}
    >
      <LogoGold width={width} height={height} />
    </div>
  );
}

export default ThemeLogo;
