/**
 * Bingo Show V2 — Design System Master Tokens
 * Agrupador central — porte 1:1 do RN.
 */

import { BingoShowColors } from './colors';
import { BingoShowTypography } from './typography';
import { BingoShowSpacing } from './spacing';
import { BingoShowRadius } from './radius';
import { BingoShowShadows } from './shadows';
import { BingoShowGlow } from './glow';
import { BingoShowAnimations } from './animations';

export const BingoShowTokens = {
  colors: BingoShowColors,
  typography: BingoShowTypography,
  spacing: BingoShowSpacing,
  radius: BingoShowRadius,
  shadows: BingoShowShadows,
  glow: BingoShowGlow,
  animations: BingoShowAnimations,
} as const;

export type IBingoShowTokens = typeof BingoShowTokens;
