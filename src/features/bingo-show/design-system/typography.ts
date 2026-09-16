/**
 * Bingo Show V2 — Design System Typography
 * Porte 1:1 do RN. Nenhum número (fontSize/letterSpacing) alterado.
 *
 * NOTA (fontFamily): no RN, `'System'` significa "usar a fonte padrão do SO"
 * (Roboto no Android, San Francisco no iOS) — não é um valor com equivalente
 * literal na web. Mantemos o token original abaixo para rastreabilidade e
 * expomos `BingoShowFontStacks`, o mapeamento explícito para pilhas de fontes
 * CSS reais (`system-ui`), documentado aqui em vez de decidido silenciosamente
 * dentro de um componente.
 */

export const BingoShowTypography = {
  fontFamily: {
    base: 'System',
    digital: 'monospace',
    heading: 'System',
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '900' as const,
  },

  fontSize: {
    micro: 8,
    tiny: 10,
    small: 12,
    body: 14,
    medium: 16,
    large: 18,
    xlarge: 22,
    title: 26,
    display: 32,
    hero: 44,
    ballCurrent: 56,
  },

  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 1,
    wider: 2,
    widest: 3,
  },

  presets: {
    displayHero: {
      fontSize: 44,
      fontWeight: '900' as const,
      letterSpacing: 1,
    },
    titleLarge: {
      fontSize: 26,
      fontWeight: '900' as const,
      letterSpacing: 1.5,
    },
    titleMedium: {
      fontSize: 20,
      fontWeight: '700' as const,
      letterSpacing: 1,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '500' as const,
      letterSpacing: 0,
    },
    labelSmall: {
      fontSize: 10,
      fontWeight: '700' as const,
      letterSpacing: 1.5,
      textTransform: 'uppercase' as const,
    },
    ballNumber: {
      fontSize: 24,
      fontWeight: '900' as const,
      includeFontPadding: false,
      textAlignVertical: 'center' as const,
    },
    digitalCountdown: {
      fontFamily: 'monospace',
      fontSize: 32,
      fontWeight: '900' as const,
    },
  },
} as const;

export type BingoShowTypographyPreset = keyof typeof BingoShowTypography.presets;

/**
 * Mapeamento explícito RN → web para `fontFamily`. Usado pelas variáveis CSS
 * `--bs-font-base` / `--bs-font-digital` / `--bs-font-heading` (ver
 * `src/styles/tokens.css`). `digital`/monospace já tinha equivalente direto.
 */
export const BingoShowFontStacks = {
  base: "'Segoe UI', Roboto, system-ui, -apple-system, sans-serif",
  heading: "'Segoe UI', Roboto, system-ui, -apple-system, sans-serif",
  digital:
    "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
} as const;
