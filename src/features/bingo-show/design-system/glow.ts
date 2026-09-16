/**
 * Bingo Show V2 — Design System Glow
 * Porte 1:1 do RN. Nenhum número alterado. Ver `toCssBoxShadow` em
 * `shadows.ts` para a mesma lógica de tradução RN → CSS aplicada aqui.
 */

import { toCssBoxShadow } from './shadows';

export const BingoShowGlow = {
  gold: {
    shadowColor: '#FFDE38',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  blue: {
    shadowColor: '#4868FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  green: {
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 12,
  },
  cyan: {
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 16,
    elevation: 10,
  },
  activeBall: {
    shadowColor: '#FFDE38',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 24,
    elevation: 16,
  },
} as const;

export type BingoShowGlowToken = keyof typeof BingoShowGlow;

/** Atalho: `BingoShowGlow.gold` → string `box-shadow` pronta pra usar em CSS. */
export function glowToCssBoxShadow(token: BingoShowGlowToken): string {
  return toCssBoxShadow(BingoShowGlow[token]);
}
