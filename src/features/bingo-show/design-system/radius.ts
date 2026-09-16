/**
 * Bingo Show V2 — Design System Radius
 * Porte 1:1 do RN. Nenhum valor alterado.
 */

export const BingoShowRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  pill: 999,
  circle: 9999,
} as const;

export type BingoShowRadiusToken = keyof typeof BingoShowRadius;
