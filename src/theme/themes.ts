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
} from './assets';

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

/**
 * resolveTheme/getThemeKey — no RN resolviam entre 4 temas a partir do
 * nome/objeto retornado pelo backend (`theme.name`/`theme.type`/`theme.id`),
 * com um flag de dev que forçava tema04. Como só migramos tema04, sempre
 * retornam o mesmo tema — a assinatura foi mantida (aceita o mesmo input
 * cru do backend) só para não quebrar quem chama, mas o valor de retorno
 * nunca varia nesta rodada.
 */
export function getThemeKey(_themeInput?: unknown): 'tema04' {
  return 'tema04';
}

export function resolveTheme(_themeInput?: unknown): ThemeTokens {
  return temaBingoShow;
}

/**
 * TEMA_GRADIENTS — porte parcial (só a entrada `tema04`, o resto era de
 * temas fora do escopo) de `TEMA_GRADIENTS` no RN. Consumido por
 * `ThemeBackground` como gradiente de fallback/overlay.
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
