/**
 * assets.ts — porte de `tvapp1/src/assets/themes/bingo-show/index.ts`.
 *
 * O RN indexa os 108 PNGs via `require()` (id numérico de módulo). Na web
 * os mesmos arquivos são servidos estaticamente a partir de
 * `public/themes/bingo-show/**` — cada chave abaixo vira uma string de path
 * (`/themes/bingo-show/<pasta>/<arquivo>.png`) em vez de um id opaco.
 * Mesmas 9 categorias, mesmas chaves, mesmos arquivos — nenhum renomeado,
 * nenhum removido. Inventário completo em
 * `docs/asset-inventory-tvscreen.md`.
 */

export function createThemeAssets(basePath = '/themes/bingo-show') {
  return {
    backgrounds: {
      bgBlueGradient: `${basePath}/backgrounds/bg-blue-gradient.png`,
      bgDark: `${basePath}/backgrounds/bg-dark.png`,
      bgGlow: `${basePath}/backgrounds/bg-glow.png`,
      bgMain: `${basePath}/backgrounds/bg-main.png`,
      bgParticle: `${basePath}/backgrounds/bg-particle.png`,
      bgSpace: `${basePath}/backgrounds/bg-space.png`,
    },
    balls: {
      ballBlueDefault: `${basePath}/balls/ball-blue-default.png`,
      ballBlueFocused: `${basePath}/balls/ball-blue-focused.png`,
      ballBlueGlow: `${basePath}/balls/ball-blue-glow.png`,
      ballBluePressed: `${basePath}/balls/ball-blue-pressed.png`,
      ballBlueSelected: `${basePath}/balls/ball-blue-selected.png`,
      ballBlueTransparent: `${basePath}/balls/ball-blue-transparent.png`,
      ballBlueWinner: `${basePath}/balls/ball-blue-winner.png`,
      ballGoldDefault: `${basePath}/balls/ball-gold-default.png`,
      ballGoldFocused: `${basePath}/balls/ball-gold-focused.png`,
      ballGoldGlow: `${basePath}/balls/ball-gold-glow.png`,
      ballGoldPressed: `${basePath}/balls/ball-gold-pressed.png`,
      ballGoldSelected: `${basePath}/balls/ball-gold-selected.png`,
      ballGoldTransparent: `${basePath}/balls/ball-gold-transparent.png`,
      ballGoldWinner: `${basePath}/balls/ball-gold-winner.png`,
      ballGreenDefault: `${basePath}/balls/ball-green-default.png`,
      ballGreenFocused: `${basePath}/balls/ball-green-focused.png`,
      ballGreenGlow: `${basePath}/balls/ball-green-glow.png`,
      ballGreenPressed: `${basePath}/balls/ball-green-pressed.png`,
      ballGreenSelected: `${basePath}/balls/ball-green-selected.png`,
      ballGreenTransparent: `${basePath}/balls/ball-green-transparent.png`,
      ballGreenWinner: `${basePath}/balls/ball-green-winner.png`,
      ballPurpleDefault: `${basePath}/balls/ball-purple-default.png`,
      ballPurpleFocused: `${basePath}/balls/ball-purple-focused.png`,
      ballPurpleGlow: `${basePath}/balls/ball-purple-glow.png`,
      ballPurplePressed: `${basePath}/balls/ball-purple-pressed.png`,
      ballPurpleSelected: `${basePath}/balls/ball-purple-selected.png`,
      ballPurpleTransparent: `${basePath}/balls/ball-purple-transparent.png`,
      ballPurpleWinner: `${basePath}/balls/ball-purple-winner.png`,
      ballRedDefault: `${basePath}/balls/ball-red-default.png`,
      ballRedFocused: `${basePath}/balls/ball-red-focused.png`,
      ballRedGlow: `${basePath}/balls/ball-red-glow.png`,
      ballRedPressed: `${basePath}/balls/ball-red-pressed.png`,
      ballRedSelected: `${basePath}/balls/ball-red-selected.png`,
      ballRedTransparent: `${basePath}/balls/ball-red-transparent.png`,
      ballRedWinner: `${basePath}/balls/ball-red-winner.png`,
      ballSilverDefault: `${basePath}/balls/ball-silver-default.png`,
      ballSilverFocused: `${basePath}/balls/ball-silver-focused.png`,
      ballSilverGlow: `${basePath}/balls/ball-silver-glow.png`,
      ballSilverPressed: `${basePath}/balls/ball-silver-pressed.png`,
      ballSilverSelected: `${basePath}/balls/ball-silver-selected.png`,
      ballSilverTransparent: `${basePath}/balls/ball-silver-transparent.png`,
      ballSilverWinner: `${basePath}/balls/ball-silver-winner.png`,
      ballYellowDefault: `${basePath}/balls/ball-yellow-default.png`,
      ballYellowFocused: `${basePath}/balls/ball-yellow-focused.png`,
      ballYellowGlow: `${basePath}/balls/ball-yellow-glow.png`,
      ballYellowPressed: `${basePath}/balls/ball-yellow-pressed.png`,
      ballYellowSelected: `${basePath}/balls/ball-yellow-selected.png`,
      ballYellowTransparent: `${basePath}/balls/ball-yellow-transparent.png`,
      ballYellowWinner: `${basePath}/balls/ball-yellow-winner.png`,
    },
    borders: {
      borderFocused: `${basePath}/borders/border-focused.png`,
      borderGlass: `${basePath}/borders/border-glass.png`,
      borderNeonBlue: `${basePath}/borders/border-neon-blue.png`,
      borderNeonGold: `${basePath}/borders/border-neon-gold.png`,
      borderWinner: `${basePath}/borders/border-winner.png`,
    },
    cards: {
      cardInfo: `${basePath}/cards/card-info.png`,
      cardJackpot: `${basePath}/cards/card-jackpot.png`,
      cardPlayer: `${basePath}/cards/card-player.png`,
      cardPrize: `${basePath}/cards/card-prize.png`,
      cardRanking: `${basePath}/cards/card-ranking.png`,
      cardSection: `${basePath}/cards/card-section.png`,
      cardTableHeader: `${basePath}/cards/card-table-header.png`,
      cardTableRow: `${basePath}/cards/card-table-row.png`,
      cardTicket: `${basePath}/cards/card-ticket.png`,
    },
    decorative: {
      decoCornerTlBlue: `${basePath}/decorative/deco-corner-tl-blue.png`,
      decoCornerTlGold: `${basePath}/decorative/deco-corner-tl-gold.png`,
      decoCornerTrGold: `${basePath}/decorative/deco-corner-tr-gold.png`,
    },
    effects: {
      effectBloom: `${basePath}/effects/effect-bloom.png`,
      effectGlassHighlight: `${basePath}/effects/effect-glass-highlight.png`,
      effectGlowBlue: `${basePath}/effects/effect-glow-blue.png`,
      effectGlowGold: `${basePath}/effects/effect-glow-gold.png`,
      effectInnerGlow: `${basePath}/effects/effect-inner-glow.png`,
      effectLightBurst: `${basePath}/effects/effect-light-burst.png`,
      effectLightSweep: `${basePath}/effects/effect-light-sweep.png`,
      effectOuterGlow: `${basePath}/effects/effect-outer-glow.png`,
      effectReflection: `${basePath}/effects/effect-reflection.png`,
      effectShine: `${basePath}/effects/effect-shine.png`,
    },
    panels: {
      panelDark: `${basePath}/panels/panel-dark.png`,
      panelFooter: `${basePath}/panels/panel-footer.png`,
      panelGlass: `${basePath}/panels/panel-glass.png`,
      panelHeader: `${basePath}/panels/panel-header.png`,
      panelMain: `${basePath}/panels/panel-main.png`,
      panelModal: `${basePath}/panels/panel-modal.png`,
      panelNeon: `${basePath}/panels/panel-neon.png`,
      panelPopup: `${basePath}/panels/panel-popup.png`,
      sidebar: `${basePath}/panels/panel-sidebar.png`,
    },
    particles: {
      particleBlue: `${basePath}/particles/particle-blue.png`,
      particleConfetti: `${basePath}/particles/particle-confetti.png`,
      particleDust: `${basePath}/particles/particle-dust.png`,
      particleGlowDots: `${basePath}/particles/particle-glow-dots.png`,
      particleGold: `${basePath}/particles/particle-gold.png`,
      particleSingleBlue: `${basePath}/particles/particle-single-blue.png`,
      particleSingleGold: `${basePath}/particles/particle-single-gold.png`,
      particleSingleSparkle: `${basePath}/particles/particle-single-sparkle.png`,
      particleSingleWhite: `${basePath}/particles/particle-single-white.png`,
      particleSparkles: `${basePath}/particles/particle-sparkles.png`,
      particleStars: `${basePath}/particles/particle-stars.png`,
    },
    textures: {
      textureBlue: `${basePath}/textures/texture-blue.png`,
      textureDark: `${basePath}/textures/texture-dark.png`,
      textureGlass: `${basePath}/textures/texture-glass.png`,
      textureGradientOverlay: `${basePath}/textures/texture-gradient-overlay.png`,
      textureNoise: `${basePath}/textures/texture-noise.png`,
      textureSpace: `${basePath}/textures/texture-space.png`,
    },
  };
}

export const assetsBingoShow = createThemeAssets('/themes/bingo-show');
export const assetsBingoShowBlue = createThemeAssets('/themes/bingo-show-blue');

export const backgrounds = assetsBingoShow.backgrounds;
export const balls = assetsBingoShow.balls;
export const borders = assetsBingoShow.borders;
export const cards = assetsBingoShow.cards;
export const decorative = assetsBingoShow.decorative;
export const effects = assetsBingoShow.effects;
export const panels = assetsBingoShow.panels;
export const particles = assetsBingoShow.particles;
export const textures = assetsBingoShow.textures;


