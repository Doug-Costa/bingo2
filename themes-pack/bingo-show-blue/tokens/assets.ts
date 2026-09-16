import { ThemeAssets } from "./types";

export function createBingoShowAssets(basePath = "/themes/bingo-show"): ThemeAssets {
  return {
    basePath,
    backgrounds: {
      main: `${basePath}/backgrounds/2x/bg-main.png`,
      dark: `${basePath}/backgrounds/2x/bg-dark.png`,
      glow: `${basePath}/backgrounds/2x/bg-glow.png`,
      blueGradient: `${basePath}/backgrounds/2x/bg-blue-gradient.png`,
      space: `${basePath}/backgrounds/2x/bg-space.png`,
      particle: `${basePath}/backgrounds/2x/bg-particle.png`,
    },
    logos: {
      main: `${basePath}/logos/logo-main.png`,
      mainSvg: `${basePath}/logos/logo-main.svg`,
      blueSvg: `${basePath}/logos/logo-blue.svg`,
      goldSvg: `${basePath}/logos/logo-gold.svg`,
      glow: `${basePath}/logos/logo-glow.png`,
      glowSvg: `${basePath}/logos/logo-glow.svg`,
      transparent: `${basePath}/logos/logo-transparent.png`,
      transparentSvg: `${basePath}/logos/logo-transparent.svg`,
      starsSvg: `${basePath}/logos/logo-stars.svg`,
      outlineSvg: `${basePath}/logos/logo-outline.svg`,
    },
    panels: {
      main: `${basePath}/panels/2x/panel-main.png`,
      glass: `${basePath}/panels/2x/panel-glass.png`,
      neon: `${basePath}/panels/2x/panel-neon.png`,
      dark: `${basePath}/panels/2x/panel-dark.png`,
      header: `${basePath}/panels/2x/panel-header.png`,
      footer: `${basePath}/panels/2x/panel-footer.png`,
      modal: `${basePath}/panels/2x/panel-modal.png`,
      popup: `${basePath}/panels/2x/panel-popup.png`,
      sidebar: `${basePath}/panels/2x/panel-sidebar.png`,
    },
    borders: {
      glass: `${basePath}/borders/2x/border-glass.png`,
      neonBlue: `${basePath}/borders/2x/border-neon-blue.png`,
      neonGold: `${basePath}/borders/2x/border-neon-gold.png`,
      winner: `${basePath}/borders/2x/border-winner.png`,
      focused: `${basePath}/borders/2x/border-focused.png`,
    },
    cards: {
      cardEmpty: `${basePath}/cards/2x/card-empty.png`,
      cardMarked: `${basePath}/cards/2x/card-marked.png`,
      cardWinner: `${basePath}/cards/2x/card-winner.png`,
    },
    icons: {
      moneyBag: `${basePath}/icons/icon-money-bag.png`,
      trevo: `${basePath}/trevo.png`,
      heart: `${basePath}/coracao.png`,
      calendar: `${basePath}/calendario.png`,
      clock: `${basePath}/relogio.png`,
      hourglass: `${basePath}/relogio_areia.png`,
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
