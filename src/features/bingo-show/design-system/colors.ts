/**
 * Bingo Show V2 — Design System Colors
 *
 * Porte 1:1 de `tvapp1/src/features/bingo-show/design-system/colors.ts` (React
 * Native). Nenhum valor foi alterado — apenas o formato do arquivo (mesmo
 * `as const`, mesmos hex/rgba). Os mesmos valores também existem como variáveis
 * CSS globais em `src/styles/tokens.css` (prefixo `--bs-color-*`), gerados a
 * partir deste arquivo, para uso direto em CSS Modules.
 */

export const BingoShowColors = {
  // Brand Primary & Secondary
  primary: '#FFDE38', // Dourado Neon principal
  primaryLight: '#FFF299', // Dourado claro brilhante
  primaryDark: '#D9991A', // Dourado escuro / sombra
  secondary: '#4868FF', // Azul Neon secundário
  secondaryLight: '#7C93FF', // Azul claro brilhante
  secondaryDark: '#1333F0', // Azul profundo

  // Backgrounds
  bgDeep: '#020412', // Fundo ultra escuro (Espaço / Pós-sorteio)
  bgMain: '#040826', // Fundo principal do jogo
  bgSurface: 'rgba(6, 10, 40, 0.85)', // Superfície padrão dos painéis
  bgElevated: 'rgba(12, 18, 56, 0.90)', // Painel elevado

  // Glassmorphism & Overlays
  glassBg: 'rgba(11, 21, 117, 0.35)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  overlayDark: 'rgba(0, 0, 0, 0.75)',
  scrim: 'rgba(0, 0, 0, 0.85)',

  // Accents / Status
  cyanNeon: '#00E5FF', // Cobre 2ª Linha / Acentuação
  greenSuccess: '#00FF88', // Cobre Bingo Total / Sucesso
  redDanger: '#FF3333', // Erro / Sorteio pausado
  goldGlow: 'rgba(255, 222, 56, 0.5)',
  blueGlow: 'rgba(72, 104, 255, 0.5)',
  greenGlow: 'rgba(0, 255, 136, 0.5)',

  // Typography Colors
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.45)',
  textOnGold: '#000000',
  textOnBlue: '#FFFFFF',

  // Grid States
  gridDefaultBg: 'rgba(6, 7, 26, 0.5)',
  gridDefaultBorder: 'rgba(255, 255, 255, 0.08)',
  gridDrawnBg: 'rgba(0, 255, 136, 0.20)',
  gridDrawnBorder: '#00FF88',
  gridCurrentBg: '#FFDE38',
  gridCurrentBorder: '#FFFFFF',

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.10)',
  borderRegular: 'rgba(255, 255, 255, 0.20)',
  borderGold: '#FFDE38',
  borderBlue: '#4868FF',
  borderWinner: '#00FF88',
} as const;

export type BingoShowColorToken = keyof typeof BingoShowColors;
