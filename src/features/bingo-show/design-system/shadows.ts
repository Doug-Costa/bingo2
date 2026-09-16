/**
 * Bingo Show V2 — Design System Shadows
 * Porte 1:1 do RN (mesmo formato `shadowColor/shadowOffset/shadowOpacity/
 * shadowRadius/elevation`) — nenhum número alterado.
 *
 * O RN não tem `box-shadow` — `toCssBoxShadow()` abaixo é a tradução mecânica
 * do modelo RN para CSS (`offsetX offsetY blurRadius color`), sem inventar
 * nenhum valor novo: `shadowOpacity` é aplicado à cor via `color-mix`.
 */

export const BingoShowShadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  regular: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 8,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.85,
    shadowRadius: 24,
    elevation: 16,
  },
} as const;

export type BingoShowShadowToken = keyof typeof BingoShowShadows;

/**
 * Forma estrutural (não a união de literais exatos de `BingoShowShadows`)
 * de um token de sombra RN. Usada como parâmetro de `toCssBoxShadow` para
 * aceitar também os tokens de `BingoShowGlow` (mesmo formato, cores/valores
 * diferentes) sem que o TS rejeite por causa da união de tipos literais
 * gerada por `as const` — comparar `shadowColor: "#FFDE38"` contra a união
 * exata de `BingoShowShadows` falha mesmo sendo estruturalmente idêntico.
 */
export interface ShadowLikeToken {
  readonly shadowColor: string;
  readonly shadowOffset: { readonly width: number; readonly height: number };
  readonly shadowOpacity: number;
  readonly shadowRadius: number;
  readonly elevation: number;
}

/**
 * Converte um token RN de sombra em uma string CSS `box-shadow` equivalente.
 * `shadowOpacity` é expresso via `color-mix(...)` para não exigir parsing de
 * hex/rgba na mão.
 */
export function toCssBoxShadow(token: ShadowLikeToken): string {
  const { shadowColor, shadowOffset, shadowOpacity, shadowRadius } = token;
  if (shadowOpacity === 0 || shadowColor === 'transparent') {
    return 'none';
  }
  const alphaPct = Math.round(shadowOpacity * 100);
  const color = `color-mix(in srgb, ${shadowColor} ${alphaPct}%, transparent)`;
  return `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px ${color}`;
}
