/**
 * themes.ts — porte de `tvapp1/src/theme/themes.ts`.
 *
 * Escopo confirmado com o usuário: só `temaBingoShow` (tema04) — tema01
 * (Ouro), tema02 (Âmbar Neon) e tema03 (Azul/PUB) ficam de fora. Por isso
 * `resolveTheme()`/`getThemeKey()` abaixo são simplificados para sempre
 * resolver `temaBingoShow`, em vez de replicar o parser de string
 * (`_resolveThemeKeyOriginal`) e o flag de dev `FORCE_BINGO_SHOW_DEV` do
 * RN — não há mais nada para "forçar", já que não existem outros temas
 * aqui. `ThemeTokens` (a interface) foi mantida completa porque
 * `temaBingoShow` usa praticamente todos os campos opcionais.
 */
import Colors from './colors';
import Typography from './typography';
import {
  backgrounds,
  balls,
  borders,
  cards,
  decorative,
  effects,
  panels,
  particles,
  textures,
  assetsBingoShowBlue,
} from './assets';
import { colorsBingoShowBlue } from './bingo-show-blue/colors';

// ─── Token types ─────────────────────────────────────────────────────────────
export interface ThemeTokens {
  bgColor: string;
  panelBg: string;
  headerBg: string;
  glassBg: string;

  primary: string;
  primaryGlow: string;
  secondary: string;
  accent: string;
  jackpotText: string;

  ballBg: string;
  ballText: string;

  countdownBg: string;
  countdownText: string;

  borderPrimary: string;
  borderSecondary: string;
  borderMuted: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  success: string;
  error: string;

  gridDrawn: string;
  gridCurrent: string;
  gridEmpty: string;

  meta?: {
    id: string;
    name: string;
    displayName: string;
    version: string;
    description: string;
    isPremium: boolean;
    supportedOrientations: ('portrait' | 'landscape')[];
    targetResolution: string;
  };

  colorsExtended?: {
    backgroundPrimary: string;
    backgroundSecondary: string;
    backgroundDeep: string;
    surfacePrimary: string;
    surfaceSecondary: string;
    surfaceGlass: string;
    surfaceElevated: string;
    goldPrimary: string;
    goldSecondary: string;
    goldLight: string;
    bluePrimary: string;
    blueSecondary: string;
    blueNeon: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textOnGold: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    borderPrimary: string;
    borderSecondary: string;
    borderGlow: string;
    overlay: string;
    scrim: string;
    focus: string;
    disabled: string;
  };

  gradients?: {
    mainBackground: string[];
    darkBackground: string[];
    header: string[];
    footer: string[];
    panel: string[];
    card: string[];
    buttonPrimary: string[];
    buttonSecondary: string[];
    gold: string[];
    blue: string[];
    focus: string[];
    winner: string[];
    modalOverlay: string[];
  };

  typography?: Record<string, unknown>;

  spacing?: {
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
    screenPaddingHorizontal: number;
    screenPaddingVertical: number;
    headerHeight: number;
    footerHeight: number;
    panelGap: number;
    cardGap: number;
    focusScale: number;
    focusBorderWidth: number;
    modalMaxWidth: number;
    rankingRowHeight: number;
    ticketSize: { width: number; height: number };
    activeBallSize: number;
    previousBallSize: number;
  };

  radius?: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
    pill: number;
    circle: number;
  };

  borders?: {
    thin: object;
    regular: object;
    strong: object;
    focus: object;
    gold: object;
    blue: object;
    glass: object;
  };

  shadows?: {
    small: object;
    medium: object;
    large: object;
    glowGold: object;
    glowBlue: object;
    winner: object;
    modal: object;
  };

  focusState?: {
    focusScale: number;
    focusOpacity: number;
    focusBorderColor: string;
    focusBorderWidth: number;
    focusBackground: string;
    focusShadow: object;
    focusGlow: object;
    pressedScale: number;
    disabledOpacity: number;
  };

  assets?: {
    backgrounds: typeof backgrounds;
    balls: typeof balls;
    borders: typeof borders;
    cards: typeof cards;
    decorative: typeof decorative;
    effects: typeof effects;
    panels: typeof panels;
    particles: typeof particles;
    textures: typeof textures;
  };

  ballsConfig?: {
    sizes: { sm: number; md: number; lg: number; xl: number };
    states: {
      default: object;
      called: object;
      active: object;
      previous: object;
      selected: object;
      winner: object;
      disabled: object;
    };
  };

  components?: {
    panels: object;
    cards: object;
    buttons: object;
    inputs: object;
    numberGrid: object;
    tickets: object;
    ranking: object;
    winnerModal: object;
    postDraw: object;
    header: object;
    footer: object;
  };

  motion?: {
    duration: { instant: number; fast: number; normal: number; slow: number; celebration: number };
    easing: { standard: string; decelerate: string; accelerate: string; emphasized: string };
    presets: Record<string, object>;
  };

  zIndex?: {
    background: number;
    texture: number;
    content: number;
    panel: number;
    header: number;
    floating: number;
    overlay: number;
    modal: number;
    winner: number;
    particles: number;
    debug: number;
  };
}

// ─── Tema Bingo Show (Premium Neon & Space) — único tema migrado ─────────────
export const temaBingoShow: ThemeTokens = {
  bgColor: Colors.bingoShow.backgroundPrimary,
  panelBg: Colors.bingoShow.surfaceGlass,
  headerBg: Colors.bingoShow.surfacePrimary,
  glassBg: 'rgba(11,21,117,0.4)',

  primary: Colors.bingoShow.goldPrimary,
  primaryGlow: Colors.bingoShow.borderGlow,
  secondary: Colors.bingoShow.bluePrimary,
  accent: Colors.bingoShow.goldPrimary,
  jackpotText: Colors.bingoShow.success,

  ballBg: Colors.bingoShow.goldPrimary,
  ballText: Colors.bingoShow.backgroundPrimary,

  countdownBg: Colors.bingoShow.backgroundSecondary,
  countdownText: Colors.bingoShow.goldPrimary,

  borderPrimary: Colors.bingoShow.borderPrimary,
  borderSecondary: Colors.bingoShow.borderSecondary,
  borderMuted: Colors.bingoShow.borderGlow,

  textPrimary: Colors.bingoShow.textPrimary,
  textSecondary: Colors.bingoShow.textSecondary,
  textMuted: Colors.bingoShow.textMuted,

  success: Colors.bingoShow.success,
  error: Colors.bingoShow.error,

  gridDrawn: Colors.bingoShow.success,
  gridCurrent: Colors.bingoShow.goldPrimary,
  gridEmpty: 'rgba(11,21,117,0.5)',

  meta: {
    id: 'theme-bingo-show',
    name: 'bingo-show',
    displayName: 'Bingo Show',
    version: '1.0.0',
    description: 'Tema premium oficial Bingo Show com luzes de neon e fundo estelar',
    isPremium: true,
    supportedOrientations: ['landscape'],
    targetResolution: '1920x1080',
  },

  colorsExtended: Colors.bingoShow,

  gradients: {
    mainBackground: ['#040826', '#020412'],
    darkBackground: ['#020412', '#000000'],
    header: ['#0b1140', 'transparent'],
    footer: ['transparent', '#020412'],
    panel: ['#0b1575', '#020412'],
    card: ['#121f8a', '#0b1575'],
    buttonPrimary: ['#ffef49', '#d38908'],
    buttonSecondary: ['#4868ff', '#1333f0'],
    gold: ['#ffef49', '#ffde38', '#d38908'],
    blue: ['#4868ff', '#1333f0', '#0a0f4f'],
    focus: ['#ffef49', '#ffde38'],
    winner: ['#00d54f', '#004d1c'],
    modalOverlay: ['rgba(4,8,38,0.85)', 'rgba(0,0,0,0.95)'],
  },

  typography: {
    displayLarge: Typography.displayLarge,
    displayMedium: Typography.displayMedium,
    titleLarge: Typography.titleLarge,
    titleMedium: Typography.titleMedium,
    titleSmall: Typography.titleSmall,
    bodyLarge: Typography.bodyLarge,
    bodyMedium: Typography.bodyMedium,
    bodySmall: Typography.bodySmall,
    labelLarge: Typography.labelLarge,
    labelMedium: Typography.labelMedium,
    labelSmall: Typography.labelSmall,
    numberLarge: Typography.numberLarge,
    numberMedium: Typography.numberMedium,
    numberSmall: Typography.numberSmall,
    digital: Typography.digital,
    winner: Typography.winner,
    ranking: Typography.ranking,
    ticket: Typography.ticket,
  },

  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
    screenPaddingHorizontal: 24,
    screenPaddingVertical: 16,
    headerHeight: 70,
    footerHeight: 50,
    panelGap: 12,
    cardGap: 8,
    focusScale: 1.05,
    focusBorderWidth: 3,
    modalMaxWidth: 600,
    rankingRowHeight: 44,
    ticketSize: { width: 140, height: 180 },
    activeBallSize: 180,
    previousBallSize: 44,
  },

  radius: {
    small: 4,
    medium: 8,
    large: 16,
    xlarge: 24,
    pill: 999,
    circle: 9999,
  },

  borders: {
    thin: { borderWidth: 1, borderColor: '#4868ff' },
    regular: { borderWidth: 2, borderColor: '#4868ff' },
    strong: { borderWidth: 3, borderColor: '#ffde38' },
    focus: { borderWidth: 3, borderColor: '#ffde38' },
    gold: { borderWidth: 2, borderColor: '#ffde38' },
    blue: { borderWidth: 2, borderColor: '#4868ff' },
    glass: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' },
  },

  shadows: {
    small: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 2 },
    medium: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
    large: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.7, shadowRadius: 12, elevation: 8 },
    glowGold: { shadowColor: '#ffde38', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 },
    glowBlue: { shadowColor: '#4868ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 },
    winner: { shadowColor: '#00d54f', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 20, elevation: 15 },
    modal: { shadowColor: '#000000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.8, shadowRadius: 24, elevation: 20 },
  },

  focusState: {
    focusScale: 1.05,
    focusOpacity: 1.0,
    focusBorderColor: '#ffde38',
    focusBorderWidth: 3,
    focusBackground: 'rgba(72,104,255,0.2)',
    focusShadow: { shadowColor: '#ffde38', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 6 },
    focusGlow: { shadowColor: '#ffde38', shadowOpacity: 0.8, shadowRadius: 12 },
    pressedScale: 0.98,
    disabledOpacity: 0.5,
  },

  assets: {
    backgrounds,
    balls,
    borders,
    cards,
    decorative,
    effects,
    panels,
    particles,
    textures,
  },

  ballsConfig: {
    sizes: { sm: 32, md: 52, lg: 176, xl: 220 },
    states: {
      default: { opacity: 0.8, scale: 1 },
      called: { opacity: 0.9, scale: 1 },
      active: { opacity: 1, scale: 1.1 },
      previous: { opacity: 0.7, scale: 0.9 },
      selected: { opacity: 1, scale: 1.05 },
      winner: { opacity: 1, scale: 1.15 },
      disabled: { opacity: 0.4, scale: 1 },
    },
  },

  components: {
    panels: { borderRadius: 18, borderWidth: 1.5, padding: 12, backgroundColor: 'rgba(11,21,117,0.7)' },
    cards: { borderRadius: 12, borderWidth: 1.5, padding: 8 },
    buttons: { borderRadius: 14, height: 48, paddingHorizontal: 16 },
    inputs: { borderRadius: 10, height: 44, borderWidth: 1.5, paddingHorizontal: 12 },
    numberGrid: { gap: 4, padding: 4 },
    tickets: { gap: 8, padding: 6 },
    ranking: { rowHeight: 44, padding: 10 },
    winnerModal: { padding: 24, borderRadius: 24 },
    postDraw: { padding: 16, gap: 12 },
    header: { height: 70, paddingHorizontal: 16 },
    footer: { height: 50, paddingHorizontal: 16 },
  },

  motion: {
    duration: { instant: 0, fast: 150, normal: 300, slow: 500, celebration: 1500 },
    easing: {
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
      emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
    },
    presets: {
      fade: { opacity: 1 },
      scaleIn: { scale: 1 },
      slideUp: { translateY: 0 },
      slideDown: { translateY: 0 },
      focus: { scale: 1.05 },
      ballEnter: { scale: 1, rotate: '0deg' },
      ballPulse: { scale: 1.1 },
      winnerEnter: { scale: 1, opacity: 1 },
      confetti: { opacity: 1, speed: 1 },
      modalEnter: { scale: 1, opacity: 1 },
      modalExit: { scale: 0.9, opacity: 0 },
    },
  },

  zIndex: {
    background: 0,
    texture: 1,
    content: 2,
    panel: 3,
    header: 4,
    floating: 5,
    overlay: 10,
    modal: 20,
    winner: 30,
    particles: 40,
    debug: 999,
  },
};

export const temaBingoShowTokens = temaBingoShow;

// ─── Tema Bingo Show Blue (Neon & Live) ───────────────────────────────────────
export const temaBingoShowBlueTokens: ThemeTokens = {
  bgColor: colorsBingoShowBlue.bgPage,
  panelBg: colorsBingoShowBlue.bgSurface,
  headerBg: colorsBingoShowBlue.bgSurfaceElevated,
  glassBg: 'rgba(8, 127, 252, 0.25)',

  primary: colorsBingoShowBlue.primary,
  primaryGlow: 'rgba(23, 200, 255, 0.6)',
  secondary: colorsBingoShowBlue.cyan,
  accent: colorsBingoShowBlue.gold,
  jackpotText: colorsBingoShowBlue.gold,

  ballBg: colorsBingoShowBlue.primary,
  ballText: '#ffffff',

  countdownBg: colorsBingoShowBlue.bgSurfaceElevated,
  countdownText: colorsBingoShowBlue.cyan,

  borderPrimary: colorsBingoShowBlue.border,
  borderSecondary: colorsBingoShowBlue.borderSubtle,
  borderMuted: 'rgba(25, 117, 210, 0.2)',

  textPrimary: colorsBingoShowBlue.textPrimary,
  textSecondary: colorsBingoShowBlue.textSecondary,
  textMuted: colorsBingoShowBlue.textMuted,

  success: colorsBingoShowBlue.green,
  error: colorsBingoShowBlue.red,

  gridDrawn: colorsBingoShowBlue.green,
  gridCurrent: colorsBingoShowBlue.cyan,
  gridEmpty: 'rgba(3, 17, 48, 0.6)',

  meta: {
    id: 'bingo-show-blue',
    name: 'bingo-show-blue',
    displayName: 'Bingo Show Blue',
    version: '1.0.0',
    description: 'Tema futurista azul espacial com iluminação neon e efeitos dourados',
    isPremium: true,
    supportedOrientations: ['landscape'],
    targetResolution: '1920x1080',
  },

  colorsExtended: {
    backgroundPrimary: colorsBingoShowBlue.bgPage,
    backgroundSecondary: colorsBingoShowBlue.bgSurfaceElevated,
    backgroundDeep: '#01030d',
    surfacePrimary: colorsBingoShowBlue.bgSurface,
    surfaceSecondary: colorsBingoShowBlue.bgSurfaceElevated,
    surfaceGlass: 'rgba(3, 17, 48, 0.8)',
    surfaceElevated: colorsBingoShowBlue.bgSurfaceElevated,
    goldPrimary: colorsBingoShowBlue.gold,
    goldSecondary: colorsBingoShowBlue.goldDark,
    goldLight: colorsBingoShowBlue.goldLight,
    bluePrimary: colorsBingoShowBlue.primary,
    blueSecondary: colorsBingoShowBlue.cyan,
    blueNeon: '#17c8ff',
    textPrimary: colorsBingoShowBlue.textPrimary,
    textSecondary: colorsBingoShowBlue.textSecondary,
    textMuted: colorsBingoShowBlue.textMuted,
    textOnGold: '#000000',
    success: colorsBingoShowBlue.green,
    warning: colorsBingoShowBlue.gold,
    error: colorsBingoShowBlue.red,
    info: colorsBingoShowBlue.cyan,
    borderPrimary: colorsBingoShowBlue.border,
    borderSecondary: colorsBingoShowBlue.borderSubtle,
    borderGlow: 'rgba(23, 200, 255, 0.5)',
    overlay: 'rgba(2, 6, 23, 0.85)',
    scrim: 'rgba(0, 0, 0, 0.9)',
    focus: colorsBingoShowBlue.cyan,
    disabled: colorsBingoShowBlue.textMuted,
  },

  gradients: {
    mainBackground: ['#020617', '#031130'],
    darkBackground: ['#01030d', '#020617'],
    header: ['#06143a', 'transparent'],
    footer: ['transparent', '#020617'],
    panel: ['#031130', '#06143a'],
    card: ['#061b4d', '#031130'],
    buttonPrimary: ['#17C8FF', '#087FFC'],
    buttonSecondary: ['#FFCF12', '#FFD54F'],
    gold: ['#FFCF12', '#FFD54F', '#D4A017'],
    blue: ['#17C8FF', '#087FFC', '#031130'],
    focus: ['#17C8FF', '#087FFC'],
    winner: ['#34D399', '#059669'],
    modalOverlay: ['rgba(2,6,23,0.9)', 'rgba(0,0,0,0.96)'],
  },

  typography: temaBingoShow.typography,
  spacing: temaBingoShow.spacing,
  radius: temaBingoShow.radius,

  borders: {
    thin: { borderWidth: 1, borderColor: '#1975D2' },
    regular: { borderWidth: 2, borderColor: '#1975D2' },
    strong: { borderWidth: 3, borderColor: '#17c8ff' },
    focus: { borderWidth: 3, borderColor: '#17c8ff' },
    gold: { borderWidth: 2, borderColor: '#FFCF12' },
    blue: { borderWidth: 2, borderColor: '#087FFC' },
    glass: { borderWidth: 1.5, borderColor: 'rgba(23, 200, 255, 0.25)' },
  },

  shadows: {
    small: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 2 },
    medium: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
    large: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.7, shadowRadius: 12, elevation: 8 },
    glowGold: { shadowColor: '#FFCF12', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 },
    glowBlue: { shadowColor: '#17c8ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.85, shadowRadius: 16, elevation: 10 },
    winner: { shadowColor: '#34D399', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 20, elevation: 15 },
    modal: { shadowColor: '#000000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.85, shadowRadius: 24, elevation: 20 },
  },

  focusState: {
    focusScale: 1.05,
    focusOpacity: 1.0,
    focusBorderColor: '#17c8ff',
    focusBorderWidth: 3,
    focusBackground: 'rgba(8, 127, 252, 0.25)',
    focusShadow: { shadowColor: '#17c8ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 6 },
    focusGlow: { shadowColor: '#17c8ff', shadowOpacity: 0.8, shadowRadius: 12 },
    pressedScale: 0.98,
    disabledOpacity: 0.5,
  },

  assets: assetsBingoShowBlue,
  ballsConfig: temaBingoShow.ballsConfig,
  components: temaBingoShow.components,
  motion: temaBingoShow.motion,
  zIndex: temaBingoShow.zIndex,
};

// ─── Tema Ouro Imperial VIP (tema01 / tema-ouro) ─────────────────────────────
export const temaOuroTokens: ThemeTokens = {
  bgColor: Colors.temaOuro.backgroundPrimary,
  panelBg: Colors.temaOuro.surfaceGlass,
  headerBg: Colors.temaOuro.surfacePrimary,
  glassBg: 'rgba(45, 30, 7, 0.45)',

  primary: Colors.temaOuro.goldPrimary,
  primaryGlow: Colors.temaOuro.borderGlow,
  secondary: Colors.temaOuro.bluePrimary,
  accent: Colors.temaOuro.goldLight,
  jackpotText: Colors.temaOuro.goldPrimary,

  ballBg: Colors.temaOuro.goldPrimary,
  ballText: Colors.temaOuro.textOnGold,

  countdownBg: Colors.temaOuro.backgroundSecondary,
  countdownText: Colors.temaOuro.goldPrimary,

  borderPrimary: Colors.temaOuro.borderPrimary,
  borderSecondary: Colors.temaOuro.borderSecondary,
  borderMuted: Colors.temaOuro.borderGlow,

  textPrimary: Colors.temaOuro.textPrimary,
  textSecondary: Colors.temaOuro.textSecondary,
  textMuted: Colors.temaOuro.textMuted,

  success: Colors.temaOuro.success,
  error: Colors.temaOuro.error,

  gridDrawn: Colors.temaOuro.success,
  gridCurrent: Colors.temaOuro.goldPrimary,
  gridEmpty: 'rgba(36, 24, 5, 0.65)',

  meta: {
    id: 'tema-ouro',
    name: 'tema-ouro',
    displayName: 'Ouro Imperial VIP',
    version: '1.0.0',
    description: 'Tema de gala com dourado nobre puro, tons âmbar e ambientação de alto luxo',
    isPremium: true,
    supportedOrientations: ['landscape'],
    targetResolution: '1920x1080',
  },

  colorsExtended: Colors.temaOuro,

  gradients: {
    mainBackground: ['#120d04', '#080602'],
    darkBackground: ['#080602', '#000000'],
    header: ['#241805', 'transparent'],
    footer: ['transparent', '#080602'],
    panel: ['#2d1e07', '#120d04'],
    card: ['#402a0a', '#241805'],
    buttonPrimary: ['#FFF066', '#FFD700', '#B8860B'],
    buttonSecondary: ['#FFB833', '#FF9900'],
    gold: ['#FFF066', '#FFD700', '#B8860B'],
    blue: ['#FFB833', '#FF9900', '#241805'],
    focus: ['#FFF066', '#FFD700'],
    winner: ['#00E676', '#007A3D'],
    modalOverlay: ['rgba(18,13,4,0.92)', 'rgba(0,0,0,0.96)'],
  },

  typography: temaBingoShow.typography,
  spacing: temaBingoShow.spacing,
  radius: temaBingoShow.radius,

  borders: {
    thin: { borderWidth: 1, borderColor: '#B8860B' },
    regular: { borderWidth: 2, borderColor: '#FFD700' },
    strong: { borderWidth: 3, borderColor: '#FFF066' },
    focus: { borderWidth: 3, borderColor: '#FFF066' },
    gold: { borderWidth: 2, borderColor: '#FFD700' },
    blue: { borderWidth: 2, borderColor: '#FF9900' },
    glass: { borderWidth: 1.5, borderColor: 'rgba(255, 215, 0, 0.25)' },
  },

  shadows: {
    small: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 2 },
    medium: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
    large: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.7, shadowRadius: 12, elevation: 8 },
    glowGold: { shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.85, shadowRadius: 16, elevation: 10 },
    glowBlue: { shadowColor: '#FF9900', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 },
    winner: { shadowColor: '#00E676', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 20, elevation: 15 },
    modal: { shadowColor: '#000000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.85, shadowRadius: 24, elevation: 20 },
  },

  focusState: {
    focusScale: 1.05,
    focusOpacity: 1.0,
    focusBorderColor: '#FFD700',
    focusBorderWidth: 3,
    focusBackground: 'rgba(255, 215, 0, 0.2)',
    focusShadow: { shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 10, elevation: 6 },
    focusGlow: { shadowColor: '#FFD700', shadowOpacity: 0.85, shadowRadius: 14 },
    pressedScale: 0.98,
    disabledOpacity: 0.5,
  },

  assets: temaBingoShow.assets,
  ballsConfig: temaBingoShow.ballsConfig,
  components: temaBingoShow.components,
  motion: temaBingoShow.motion,
  zIndex: temaBingoShow.zIndex,
};

// ─── Tema Cyber Neon (tema02 / tema-neon) ───────────────────────────────────
export const temaNeonTokens: ThemeTokens = {
  bgColor: Colors.temaNeon.backgroundPrimary,
  panelBg: Colors.temaNeon.surfaceGlass,
  headerBg: Colors.temaNeon.surfacePrimary,
  glassBg: 'rgba(48, 8, 76, 0.45)',

  primary: Colors.temaNeon.goldPrimary,
  primaryGlow: Colors.temaNeon.borderGlow,
  secondary: Colors.temaNeon.blueSecondary,
  accent: Colors.temaNeon.goldLight,
  jackpotText: Colors.temaNeon.blueSecondary,

  ballBg: Colors.temaNeon.goldPrimary,
  ballText: '#FFFFFF',

  countdownBg: Colors.temaNeon.backgroundSecondary,
  countdownText: Colors.temaNeon.blueSecondary,

  borderPrimary: Colors.temaNeon.borderPrimary,
  borderSecondary: Colors.temaNeon.borderSecondary,
  borderMuted: Colors.temaNeon.borderGlow,

  textPrimary: Colors.temaNeon.textPrimary,
  textSecondary: Colors.temaNeon.textSecondary,
  textMuted: Colors.temaNeon.textMuted,

  success: Colors.temaNeon.success,
  error: Colors.temaNeon.error,

  gridDrawn: Colors.temaNeon.success,
  gridCurrent: Colors.temaNeon.blueSecondary,
  gridEmpty: 'rgba(38, 5, 59, 0.65)',

  meta: {
    id: 'tema-neon',
    name: 'tema-neon',
    displayName: 'Cyber Neon (Violeta & Magenta)',
    version: '1.0.0',
    description: 'Estética cyberpunk futurista com iluminação neon magenta, ultravioleta e ciano elétrico',
    isPremium: true,
    supportedOrientations: ['landscape'],
    targetResolution: '1920x1080',
  },

  colorsExtended: Colors.temaNeon,

  gradients: {
    mainBackground: ['#13021f', '#0a0110'],
    darkBackground: ['#0a0110', '#000000'],
    header: ['#26053b', 'transparent'],
    footer: ['transparent', '#0a0110'],
    panel: ['#30084c', '#13021f'],
    card: ['#470c70', '#26053b'],
    buttonPrimary: ['#FF54FF', '#E000FF', '#7928CA'],
    buttonSecondary: ['#00F5FF', '#00B4D8'],
    gold: ['#FF54FF', '#E000FF', '#7928CA'],
    blue: ['#00F5FF', '#7928CA', '#26053b'],
    focus: ['#00F5FF', '#E000FF'],
    winner: ['#00FF9D', '#008C53'],
    modalOverlay: ['rgba(19,2,31,0.92)', 'rgba(0,0,0,0.96)'],
  },

  typography: temaBingoShow.typography,
  spacing: temaBingoShow.spacing,
  radius: temaBingoShow.radius,

  borders: {
    thin: { borderWidth: 1, borderColor: '#7928CA' },
    regular: { borderWidth: 2, borderColor: '#E000FF' },
    strong: { borderWidth: 3, borderColor: '#00F5FF' },
    focus: { borderWidth: 3, borderColor: '#00F5FF' },
    gold: { borderWidth: 2, borderColor: '#E000FF' },
    blue: { borderWidth: 2, borderColor: '#00F5FF' },
    glass: { borderWidth: 1.5, borderColor: 'rgba(224, 0, 255, 0.3)' },
  },

  shadows: {
    small: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 2 },
    medium: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
    large: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.7, shadowRadius: 12, elevation: 8 },
    glowGold: { shadowColor: '#E000FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.85, shadowRadius: 16, elevation: 10 },
    glowBlue: { shadowColor: '#00F5FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.85, shadowRadius: 16, elevation: 10 },
    winner: { shadowColor: '#00FF9D', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 20, elevation: 15 },
    modal: { shadowColor: '#000000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.85, shadowRadius: 24, elevation: 20 },
  },

  focusState: {
    focusScale: 1.05,
    focusOpacity: 1.0,
    focusBorderColor: '#00F5FF',
    focusBorderWidth: 3,
    focusBackground: 'rgba(0, 245, 255, 0.2)',
    focusShadow: { shadowColor: '#00F5FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.85, shadowRadius: 12, elevation: 6 },
    focusGlow: { shadowColor: '#00F5FF', shadowOpacity: 0.85, shadowRadius: 14 },
    pressedScale: 0.98,
    disabledOpacity: 0.5,
  },

  assets: temaBingoShow.assets,
  ballsConfig: temaBingoShow.ballsConfig,
  components: temaBingoShow.components,
  motion: temaBingoShow.motion,
  zIndex: temaBingoShow.zIndex,
};

// ─── Tema Safira PUB (tema03 / tema-pub) ─────────────────────────────────────
export const temaPubTokens: ThemeTokens = {
  bgColor: Colors.temaPub.backgroundPrimary,
  panelBg: Colors.temaPub.surfaceGlass,
  headerBg: Colors.temaPub.surfacePrimary,
  glassBg: 'rgba(8, 56, 99, 0.45)',

  primary: Colors.temaPub.goldPrimary,
  primaryGlow: Colors.temaPub.borderGlow,
  secondary: Colors.temaPub.blueSecondary,
  accent: Colors.temaPub.goldLight,
  jackpotText: Colors.temaPub.blueSecondary,

  ballBg: Colors.temaPub.goldPrimary,
  ballText: '#FFFFFF',

  countdownBg: Colors.temaPub.backgroundSecondary,
  countdownText: Colors.temaPub.goldLight,

  borderPrimary: Colors.temaPub.borderPrimary,
  borderSecondary: Colors.temaPub.borderSecondary,
  borderMuted: Colors.temaPub.borderGlow,

  textPrimary: Colors.temaPub.textPrimary,
  textSecondary: Colors.temaPub.textSecondary,
  textMuted: Colors.temaPub.textMuted,

  success: Colors.temaPub.success,
  error: Colors.temaPub.error,

  gridDrawn: Colors.temaPub.success,
  gridCurrent: Colors.temaPub.goldLight,
  gridEmpty: 'rgba(6, 40, 70, 0.65)',

  meta: {
    id: 'tema-pub',
    name: 'tema-pub',
    displayName: 'Safira PUB (Azul & Esmeralda)',
    version: '1.0.0',
    description: 'Ambiente pub e lounge moderno com azul safira noturno e toques em verde esmeralda',
    isPremium: true,
    supportedOrientations: ['landscape'],
    targetResolution: '1920x1080',
  },

  colorsExtended: Colors.temaPub,

  gradients: {
    mainBackground: ['#031525', '#010b14'],
    darkBackground: ['#010b14', '#000000'],
    header: ['#062846', 'transparent'],
    footer: ['transparent', '#010b14'],
    panel: ['#083863', '#031525'],
    card: ['#0d4e8a', '#062846'],
    buttonPrimary: ['#90E0EF', '#00B4D8', '#0077B6'],
    buttonSecondary: ['#06D6A0', '#049F75'],
    gold: ['#90E0EF', '#00B4D8', '#0077B6'],
    blue: ['#00B4D8', '#0077B6', '#062846'],
    focus: ['#06D6A0', '#00B4D8'],
    winner: ['#06D6A0', '#04805E'],
    modalOverlay: ['rgba(3,21,37,0.92)', 'rgba(0,0,0,0.96)'],
  },

  typography: temaBingoShow.typography,
  spacing: temaBingoShow.spacing,
  radius: temaBingoShow.radius,

  borders: {
    thin: { borderWidth: 1, borderColor: '#0077B6' },
    regular: { borderWidth: 2, borderColor: '#00B4D8' },
    strong: { borderWidth: 3, borderColor: '#06D6A0' },
    focus: { borderWidth: 3, borderColor: '#06D6A0' },
    gold: { borderWidth: 2, borderColor: '#00B4D8' },
    blue: { borderWidth: 2, borderColor: '#06D6A0' },
    glass: { borderWidth: 1.5, borderColor: 'rgba(0, 180, 216, 0.3)' },
  },

  shadows: {
    small: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 2 },
    medium: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 },
    large: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.7, shadowRadius: 12, elevation: 8 },
    glowGold: { shadowColor: '#00B4D8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.85, shadowRadius: 16, elevation: 10 },
    glowBlue: { shadowColor: '#06D6A0', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.85, shadowRadius: 16, elevation: 10 },
    winner: { shadowColor: '#06D6A0', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 20, elevation: 15 },
    modal: { shadowColor: '#000000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.85, shadowRadius: 24, elevation: 20 },
  },

  focusState: {
    focusScale: 1.05,
    focusOpacity: 1.0,
    focusBorderColor: '#06D6A0',
    focusBorderWidth: 3,
    focusBackground: 'rgba(6, 214, 160, 0.2)',
    focusShadow: { shadowColor: '#06D6A0', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.85, shadowRadius: 12, elevation: 6 },
    focusGlow: { shadowColor: '#06D6A0', shadowOpacity: 0.85, shadowRadius: 14 },
    pressedScale: 0.98,
    disabledOpacity: 0.5,
  },

  assets: temaBingoShow.assets,
  ballsConfig: temaBingoShow.ballsConfig,
  components: temaBingoShow.components,
  motion: temaBingoShow.motion,
  zIndex: temaBingoShow.zIndex,
};

export interface ThemeOption {
  id: string;
  name: string;
  displayName: string;
  description: string;
  badge?: string;
  previewColors: {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
  };
}

export const AVAILABLE_THEMES: ThemeOption[] = [
  {
    id: 'bingo-show',
    name: 'bingo-show',
    displayName: 'Bingo Show (Ouro & Espaço)',
    description: 'Tema oficial clássico com tons dourados nobres e ambientação estelar profunda.',
    badge: 'Padrão',
    previewColors: {
      primary: '#ffde38',
      secondary: '#4868ff',
      background: '#040826',
      accent: '#00d54f',
    },
  },
  {
    id: 'bingo-show-blue',
    name: 'bingo-show-blue',
    displayName: 'Bingo Show Blue (Azul Live & Neon)',
    description: 'Tema futurista azul espacial com iluminação neon ciano e alta visibilidade.',
    badge: 'Novo',
    previewColors: {
      primary: '#087FFC',
      secondary: '#17C8FF',
      background: '#020617',
      accent: '#FFCF12',
    },
  },
  {
    id: 'tema-ouro',
    name: 'tema-ouro',
    displayName: 'Ouro Imperial VIP',
    description: 'Tema de gala com dourado ouro puro, tons âmbar e fundo preto ônix de alto luxo.',
    badge: 'VIP',
    previewColors: {
      primary: '#FFD700',
      secondary: '#FF9900',
      background: '#120D04',
      accent: '#FFF066',
    },
  },
  {
    id: 'tema-neon',
    name: 'tema-neon',
    displayName: 'Cyber Neon (Violeta & Magenta)',
    description: 'Visual cyberpunk moderno com iluminação magenta neon, ultravioleta e ciano elétrico.',
    badge: 'Cyber',
    previewColors: {
      primary: '#E000FF',
      secondary: '#7928CA',
      background: '#13021F',
      accent: '#00F5FF',
    },
  },
  {
    id: 'tema-pub',
    name: 'tema-pub',
    displayName: 'Safira PUB (Azul & Esmeralda)',
    description: 'Tema lounge sofisticado em azul safira noturno e toques em verde esmeralda.',
    badge: 'PUB',
    previewColors: {
      primary: '#00B4D8',
      secondary: '#0077B6',
      background: '#031525',
      accent: '#06D6A0',
    },
  },
];

/**
 * getThemeKey — normaliza a chave do tema suportando nomes, IDs e aliases legados.
 */
export function getThemeKey(themeInput?: unknown): string {
  if (!themeInput) return 'bingo-show';
  if (typeof themeInput === 'string') {
    const norm = themeInput.toLowerCase().trim();
    if (norm.includes('blue') || norm === 'tema-blue' || norm === 'bingo-show-blue') {
      return 'bingo-show-blue';
    }
    if (norm.includes('ouro') || norm.includes('gold') || norm === 'tema01' || norm === 'tema-ouro') {
      return 'tema-ouro';
    }
    if (norm.includes('neon') || norm.includes('cyber') || norm.includes('ambar') || norm === 'tema02' || norm === 'tema-neon') {
      return 'tema-neon';
    }
    if (norm.includes('pub') || norm.includes('safira') || norm === 'tema03' || norm === 'tema-pub') {
      return 'tema-pub';
    }
    return 'bingo-show';
  }
  if (typeof themeInput === 'object' && themeInput !== null) {
    const id = String((themeInput as any).id || (themeInput as any).name || (themeInput as any).type || '').toLowerCase();
    if (id.includes('blue') || id === 'tema-blue') return 'bingo-show-blue';
    if (id.includes('ouro') || id.includes('gold') || id === 'tema01' || id === 'tema-ouro') return 'tema-ouro';
    if (id.includes('neon') || id.includes('cyber') || id.includes('ambar') || id === 'tema02' || id === 'tema-neon') return 'tema-neon';
    if (id.includes('pub') || id.includes('safira') || id === 'tema03' || id === 'tema-pub') return 'tema-pub';
  }
  return 'bingo-show';
}

/**
 * resolveTheme — retorna o ThemeTokens correspondente ao tema selecionado ou de entrada.
 */
export function resolveTheme(themeInput?: unknown): ThemeTokens {
  const key = getThemeKey(themeInput);
  switch (key) {
    case 'bingo-show-blue':
      return temaBingoShowBlueTokens;
    case 'tema-ouro':
      return temaOuroTokens;
    case 'tema-neon':
      return temaNeonTokens;
    case 'tema-pub':
      return temaPubTokens;
    case 'bingo-show':
    default:
      return temaBingoShow;
  }
}

export { temaBingoShowBlue } from './bingo-show-blue';

/**
 * TEMA_GRADIENTS — gradientes mapeados para cada tema.
 */
export const TEMA_GRADIENTS = {
  tema04: {
    bg: ['#040826', '#020412'],
    ball: ['#ffef49', '#ffde38', '#d38908'],
    prize1: ['#1333f0', '#001bcb'],
    prize2: ['#0b1575', '#0a0f4f'],
    prize3: ['#0a0f4f', '#040826'],
    header: ['#0b1140', '#050824'],
  },
  'bingo-show': {
    bg: ['#040826', '#020412'],
    ball: ['#ffef49', '#ffde38', '#d38908'],
    prize1: ['#1333f0', '#001bcb'],
    prize2: ['#0b1575', '#0a0f4f'],
    prize3: ['#0a0f4f', '#040826'],
    header: ['#0b1140', '#050824'],
  },
  'bingo-show-blue': {
    bg: ['#020617', '#031130'],
    ball: ['#17C8FF', '#087FFC', '#FFCF12'],
    prize1: ['#087FFC', '#031130'],
    prize2: ['#06143a', '#020617'],
    prize3: ['#031130', '#01030d'],
    header: ['#06143a', '#031130'],
  },
  'tema-ouro': {
    bg: ['#120d04', '#080602'],
    ball: ['#FFF066', '#FFD700', '#B8860B'],
    prize1: ['#FF9900', '#B8860B'],
    prize2: ['#402a0a', '#241805'],
    prize3: ['#241805', '#120d04'],
    header: ['#241805', '#120d04'],
  },
  tema01: {
    bg: ['#120d04', '#080602'],
    ball: ['#FFF066', '#FFD700', '#B8860B'],
    prize1: ['#FF9900', '#B8860B'],
    prize2: ['#402a0a', '#241805'],
    prize3: ['#241805', '#120d04'],
    header: ['#241805', '#120d04'],
  },
  'tema-neon': {
    bg: ['#13021f', '#0a0110'],
    ball: ['#FF54FF', '#E000FF', '#7928CA'],
    prize1: ['#E000FF', '#7928CA'],
    prize2: ['#470c70', '#26053b'],
    prize3: ['#26053b', '#13021f'],
    header: ['#26053b', '#13021f'],
  },
  tema02: {
    bg: ['#13021f', '#0a0110'],
    ball: ['#FF54FF', '#E000FF', '#7928CA'],
    prize1: ['#E000FF', '#7928CA'],
    prize2: ['#470c70', '#26053b'],
    prize3: ['#26053b', '#13021f'],
    header: ['#26053b', '#13021f'],
  },
  'tema-pub': {
    bg: ['#031525', '#010b14'],
    ball: ['#90E0EF', '#00B4D8', '#0077B6'],
    prize1: ['#00B4D8', '#0077B6'],
    prize2: ['#0d4e8a', '#062846'],
    prize3: ['#062846', '#031525'],
    header: ['#062846', '#031525'],
  },
  tema03: {
    bg: ['#031525', '#010b14'],
    ball: ['#90E0EF', '#00B4D8', '#0077B6'],
    prize1: ['#00B4D8', '#0077B6'],
    prize2: ['#0d4e8a', '#062846'],
    prize3: ['#062846', '#031525'],
    header: ['#062846', '#031525'],
  },
} as const;

/** alphaColor — porte 1:1 (sem alteração de lógica/valores). */
export function alphaColor(color: string | undefined | null, alphaHex: string = 'ff'): string {
  if (!color) return '#ffffff';
  let c = String(color).trim();
  if (c.startsWith('#')) {
    if (c.length === 4) {
      const r = c[1],
        g = c[2],
        b = c[3];
      c = `#${r}${r}${g}${g}${b}${b}`;
    }
    if (c.length === 7) {
      return `${c}${alphaHex}`;
    }
  }
  return c;
}



