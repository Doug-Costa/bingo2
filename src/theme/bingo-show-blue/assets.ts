import { ThemeAssets } from "./types";

export function createBingoShowAssets(basePath = "/themes/bingo-show-blue"): ThemeAssets {
  return {
    basePath,
    backgrounds: {
      main: `${basePath}/backgrounds/2x/bg-main.webp`,
      dark: `${basePath}/backgrounds/2x/bg-dark.webp`,
      glow: `${basePath}/backgrounds/2x/bg-glow.webp`,
      blueGradient: `${basePath}/backgrounds/2x/bg-blue-gradient.webp`,
      space: `${basePath}/backgrounds/2x/bg-space.webp`,
      particle: `${basePath}/backgrounds/2x/bg-particle.webp`,
    },
    logos: {
      main: `${basePath}/logos/logo-main.webp`,
      mainSvg: `${basePath}/logos/logo-main.svg`,
      blueSvg: `${basePath}/logos/logo-blue.svg`,
      goldSvg: `${basePath}/logos/logo-gold.svg`,
      glow: `${basePath}/logos/logo-glow.webp`,
      glowSvg: `${basePath}/logos/logo-glow.svg`,
      transparent: `${basePath}/logos/logo-transparent.webp`,
      transparentSvg: `${basePath}/logos/logo-transparent.svg`,
      starsSvg: `${basePath}/logos/logo-stars.svg`,
      outlineSvg: `${basePath}/logos/logo-outline.svg`,
    },
    panels: {
      main: `${basePath}/panels/2x/panel-main.webp`,
      glass: `${basePath}/panels/2x/panel-glass.webp`,
      neon: `${basePath}/panels/2x/panel-neon.webp`,
      dark: `${basePath}/panels/2x/panel-dark.webp`,
      header: `${basePath}/panels/2x/panel-header.webp`,
      footer: `${basePath}/panels/2x/panel-footer.webp`,
      modal: `${basePath}/panels/2x/panel-modal.webp`,
      popup: `${basePath}/panels/2x/panel-popup.webp`,
      sidebar: `${basePath}/panels/2x/panel-sidebar.webp`,
    },
    borders: {
      glass: `${basePath}/borders/2x/border-glass.webp`,
      neonBlue: `${basePath}/borders/2x/border-neon-blue.webp`,
      neonGold: `${basePath}/borders/2x/border-neon-gold.webp`,
      winner: `${basePath}/borders/2x/border-winner.webp`,
      focused: `${basePath}/borders/2x/border-focused.webp`,
    },
    cards: {
      cardEmpty: `${basePath}/cards/2x/card-empty.webp`,
      cardMarked: `${basePath}/cards/2x/card-marked.webp`,
      cardWinner: `${basePath}/cards/2x/card-winner.webp`,
    },
    icons: {
      moneyBag: `${basePath}/icons/icon-money-bag.webp`,
      trevo: `${basePath}/trevo.webp`,
      heart: `${basePath}/coracao.webp`,
      calendar: `${basePath}/calendario.webp`,
      clock: `${basePath}/relogio.webp`,
      hourglass: `${basePath}/relogio_areia.webp`,
      bingoCage: `${basePath}/bingo-cage.jpg`,
      jackpot: `${basePath}/icons/icon-jackpot.svg`,
      ticket: `${basePath}/icons/icon-ticket.svg`,
      wallet: `${basePath}/icons/icon-wallet.svg`,
      winner: `${basePath}/icons/icon-winner.svg`,
      star: `${basePath}/icons/icon-star.svg`,
      coins: `${basePath}/icons/icon-coins.svg`,
    },
    ballsPath: `${basePath}/balls`,
  };
}

export const bingoShowBlueAssets = createBingoShowAssets();
