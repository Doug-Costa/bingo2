/**
 * Bingo Show V2 — Design System Spacing
 * Porte 1:1 do RN (mesmos números, agora em `px` quando usados via CSS var —
 * ver `src/styles/tokens.css`). Nenhum valor alterado.
 */

export const BingoShowSpacing = {
  // Scale
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,

  // Layout Specifics
  screenPaddingHorizontal: 24,
  screenPaddingVertical: 16,
  overscanMarginTV: 16,
  headerHeight: 70,
  footerHeight: 50,
  panelGap: 12,
  cardGap: 8,
  gridGap: 4,

  // Component Paddings
  cardPaddingInner: 12,
  modalPaddingInner: 20,
  ticketCellGap: 6,
} as const;

export type BingoShowSpacingToken = keyof typeof BingoShowSpacing;
