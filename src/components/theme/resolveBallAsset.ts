/**
 * resolveBallAsset.ts — porte de `tvapp1/src/components/theme/resolveBallAsset.ts`.
 * `source: any` (RN, id de módulo `require()`) → `source: string | null`
 * (path estático). Nenhuma regra de mapeamento estado→variante→asset
 * alterada.
 */
import type { ThemeTokens } from '@/theme/themes';

export type BallVisualState = 'default' | 'active' | 'called' | 'previous' | 'selected' | 'winner' | 'disabled';

export type BallVisualVariant =
  | 'default'
  | 'activeHighlight'
  | 'calledTransparent'
  | 'previousGlow'
  | 'selectedHighlight'
  | 'winnerHighlight'
  | 'disabledTransparent';

export interface ResolvedBall {
  source: string | null;
  textColor: string;
  glowColor?: string;
  shadowColor?: string;
  visualVariant: BallVisualVariant;
}

/** Grupo de cor semântica da bola com base no número (regra do Bingo). */
export function getBallColorGroup(n: number): 'yellow' | 'green' | 'red' | 'blue' | 'purple' {
  if (n <= 18) return 'yellow';
  if (n <= 36) return 'green';
  if (n <= 54) return 'red';
  if (n <= 72) return 'blue';
  return 'purple';
}

export function resolveBallAsset(theme: ThemeTokens, num: number, state: BallVisualState = 'default'): ResolvedBall {
  let visualVariant: BallVisualVariant = 'default';
  switch (state) {
    case 'active':
      visualVariant = 'activeHighlight';
      break;
    case 'winner':
      visualVariant = 'winnerHighlight';
      break;
    case 'selected':
      visualVariant = 'selectedHighlight';
      break;
    case 'called':
      visualVariant = 'calledTransparent';
      break;
    case 'previous':
      visualVariant = 'previousGlow';
      break;
    case 'disabled':
      visualVariant = 'disabledTransparent';
      break;
    default:
      visualVariant = 'default';
      break;
  }

  if (!theme.assets || !theme.assets.balls) {
    const legacyColors = {
      yellow: { bg: '#ca8a04', text: '#ffffff' },
      green: { bg: '#064e3b', text: '#ffffff' },
      red: { bg: '#7f1d1d', text: '#ffffff' },
      blue: { bg: '#1e3a5f', text: '#ffffff' },
      purple: { bg: '#4c1d95', text: '#ffffff' },
    };
    const group = getBallColorGroup(num);
    const defaults = legacyColors[group];

    return {
      source: null,
      textColor: state === 'active' ? '#000000' : defaults.text,
      shadowColor: defaults.bg,
      visualVariant,
    };
  }

  let colorPrefix = 'ball';
  const group = getBallColorGroup(num);
  switch (group) {
    case 'yellow':
      colorPrefix += 'Yellow';
      break;
    case 'green':
      colorPrefix += 'Green';
      break;
    case 'red':
      colorPrefix += 'Red';
      break;
    case 'blue':
      colorPrefix += 'Blue';
      break;
    case 'purple':
      colorPrefix += 'Purple';
      break;
  }

  let suffix = 'Default';
  let textColor = '#ffffff';
  let glowColor: string | undefined;

  switch (visualVariant) {
    case 'activeHighlight':
      suffix = 'Winner';
      textColor = '#000000';
      glowColor = theme.primaryGlow || 'rgba(255, 222, 56, 0.6)';
      break;
    case 'winnerHighlight':
      colorPrefix = 'ballGold';
      suffix = 'Winner';
      textColor = '#000000';
      glowColor = 'rgba(255, 222, 56, 0.8)';
      break;
    case 'selectedHighlight':
      suffix = 'Selected';
      textColor = '#000000';
      break;
    case 'calledTransparent':
      suffix = 'Transparent';
      textColor = 'rgba(255, 255, 255, 0.7)';
      break;
    case 'previousGlow':
      suffix = 'Glow';
      glowColor = 'rgba(72, 104, 255, 0.3)';
      break;
    case 'disabledTransparent':
      suffix = 'Transparent';
      textColor = 'rgba(255, 255, 255, 0.4)';
      break;
    default:
      suffix = 'Default';
      textColor = '#ffffff';
      break;
  }

  const assetKey = `${colorPrefix}${suffix}`;
  const balls = theme.assets.balls as unknown as Record<string, string>;
  let source: string | null = balls[assetKey] ?? null;

  if (!source) {
    source = balls.ballSilverDefault ?? balls.ballBlueDefault ?? null;
  }

  return {
    source,
    textColor,
    glowColor,
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    visualVariant,
  };
}

export default resolveBallAsset;
