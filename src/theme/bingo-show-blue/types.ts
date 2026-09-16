export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  bgPage: string;
  bgSurface: string;
  bgSurfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  primary: string;
  primaryHover: string;
  primaryLight: string;
  
  gold: string;
  goldDark: string;
  goldLight: string;
  cyan: string;
  blue: string;
  purple: string;
  purpleLight: string;
  coral: string;
  coralLight: string;
  red: string;
  green: string;
  greenLight: string;
  
  border: string;
  borderSubtle: string;
  
  shadowSubtle: string;
  shadowCard: string;
  shadowHover: string;
  shadowGlow: string;
}

export interface ThemeBackgroundAssets {
  main: string;
  dark?: string;
  glow?: string;
  blueGradient?: string;
  space?: string;
  particle?: string;
}

export interface ThemeLogoAssets {
  main: string;
  mainSvg?: string;
  blueSvg?: string;
  goldSvg?: string;
  glow?: string;
  glowSvg?: string;
  transparent?: string;
  transparentSvg?: string;
  starsSvg?: string;
  outlineSvg?: string;
}

export interface ThemePanelAssets {
  main?: string;
  glass?: string;
  neon?: string;
  dark?: string;
  header?: string;
  footer?: string;
  modal?: string;
  popup?: string;
  sidebar?: string;
}

export interface ThemeBorderAssets {
  glass?: string;
  neonBlue?: string;
  neonGold?: string;
  winner?: string;
  focused?: string;
}

export interface ThemeCardAssets {
  cardEmpty?: string;
  cardMarked?: string;
  cardWinner?: string;
}

export interface ThemeIconAssets {
  moneyBag?: string;
  trevo?: string;
  heart?: string;
  calendar?: string;
  clock?: string;
  hourglass?: string;
  bingoCage?: string;
  jackpot?: string;
  ticket?: string;
  wallet?: string;
  winner?: string;
  star?: string;
  coins?: string;
}

export interface ThemeAssets {
  basePath: string;
  backgrounds: ThemeBackgroundAssets;
  logos: ThemeLogoAssets;
  panels: ThemePanelAssets;
  borders: ThemeBorderAssets;
  cards: ThemeCardAssets;
  icons: ThemeIconAssets;
  ballsPath: string;
}

export interface ThemeTypography {
  fontPrimary: string;
  fontHeading: string;
  weights: {
    regular: number;
    medium: number;
    semibold: number;
    bold: number;
    black: number;
  };
}

export interface ThemeTokens {
  id: string;
  name: string;
  icon: string;
  description: string;
  mode: "light" | "dark";
  colors: ThemeColors;
  assets: ThemeAssets;
  typography: ThemeTypography;
}
