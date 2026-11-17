/**
 * assets.ts — porte de `tvapp1/src/assets/themes/bingo-show/index.ts`.
 *
 * O RN indexa os 108 PNGs via `require()` (id numérico de módulo). Na web
 * os mesmos arquivos são servidos estaticamente a partir de
 * `public/themes/bingo-show/**` — cada chave abaixo vira uma string de path
 * (`/themes/bingo-show/<pasta>/<arquivo>.webp`) em vez de um id opaco.
 * Mesmas 9 categorias, mesmas chaves, mesmos arquivos — nenhum renomeado,
 * nenhum removido. Inventário completo em
 * `docs/asset-inventory-tvscreen.md`.
 */

export function createThemeAssets(basePath = '/themes/bingo-show') {
  return {
    backgrounds: {
      bgBlueGradient: `${basePath}/backgrounds/bg-blue-gradient.webp`,
      bgDark: `${basePath}/backgrounds/bg-dark.webp`,
      bgGlow: `${basePath}/backgrounds/bg-glow.webp`,
      bgMain: `${basePath}/backgrounds/bg-main.webp`,
      bgParticle: `${basePath}/backgrounds/bg-particle.webp`,
      bgSpace: `${basePath}/backgrounds/bg-space.webp`,
    },
    balls: {
      ballBlueDefault: `${basePath}/balls/ball-blue-default.webp`,
      ballBlueFocused: `${basePath}/balls/ball-blue-focused.webp`,
      ballBlueGlow: `${basePath}/balls/ball-blue-glow.webp`,
      ballBluePressed: `${basePath}/balls/ball-blue-pressed.webp`,
      ballBlueSelected: `${basePath}/balls/ball-blue-selected.webp`,
      ballBlueTransparent: `${basePath}/balls/ball-blue-transparent.webp`,
      ballBlueWinner: `${basePath}/balls/ball-blue-winner.webp`,
      ballGoldDefault: `${basePath}/balls/ball-gold-default.webp`,
      ballGoldFocused: `${basePath}/balls/ball-gold-focused.webp`,
      ballGoldGlow: `${basePath}/balls/ball-gold-glow.webp`,
      ballGoldPressed: `${basePath}/balls/ball-gold-pressed.webp`,
      ballGoldSelected: `${basePath}/balls/ball-gold-selected.webp`,
      ballGoldTransparent: `${basePath}/balls/ball-gold-transparent.webp`,
      ballGoldWinner: `${basePath}/balls/ball-gold-winner.webp`,
      ballGreenDefault: `${basePath}/balls/ball-green-default.webp`,
      ballGreenFocused: `${basePath}/balls/ball-green-focused.webp`,
      ballGreenGlow: `${basePath}/balls/ball-green-glow.webp`,
      ballGreenPressed: `${basePath}/balls/ball-green-pressed.webp`,
      ballGreenSelected: `${basePath}/balls/ball-green-selected.webp`,
      ballGreenTransparent: `${basePath}/balls/ball-green-transparent.webp`,
      ballGreenWinner: `${basePath}/balls/ball-green-winner.webp`,
      ballPurpleDefault: `${basePath}/balls/ball-purple-default.webp`,
      ballPurpleFocused: `${basePath}/balls/ball-purple-focused.webp`,
      ballPurpleGlow: `${basePath}/balls/ball-purple-glow.webp`,
      ballPurplePressed: `${basePath}/balls/ball-purple-pressed.webp`,
      ballPurpleSelected: `${basePath}/balls/ball-purple-selected.webp`,
      ballPurpleTransparent: `${basePath}/balls/ball-purple-transparent.webp`,
      ballPurpleWinner: `${basePath}/balls/ball-purple-winner.webp`,
      ballRedDefault: `${basePath}/balls/ball-red-default.webp`,
      ballRedFocused: `${basePath}/balls/ball-red-focused.webp`,
      ballRedGlow: `${basePath}/balls/ball-red-glow.webp`,
      ballRedPressed: `${basePath}/balls/ball-red-pressed.webp`,
      ballRedSelected: `${basePath}/balls/ball-red-selected.webp`,
      ballRedTransparent: `${basePath}/balls/ball-red-transparent.webp`,
      ballRedWinner: `${basePath}/balls/ball-red-winner.webp`,
      ballSilverDefault: `${basePath}/balls/ball-silver-default.webp`,
      ballSilverFocused: `${basePath}/balls/ball-silver-focused.webp`,
      ballSilverGlow: `${basePath}/balls/ball-silver-glow.webp`,
      ballSilverPressed: `${basePath}/balls/ball-silver-pressed.webp`,
      ballSilverSelected: `${basePath}/balls/ball-silver-selected.webp`,
      ballSilverTransparent: `${basePath}/balls/ball-silver-transparent.webp`,
      ballSilverWinner: `${basePath}/balls/ball-silver-winner.webp`,
      ballYellowDefault: `${basePath}/balls/ball-yellow-default.webp`,
      ballYellowFocused: `${basePath}/balls/ball-yellow-focused.webp`,
      ballYellowGlow: `${basePath}/balls/ball-yellow-glow.webp`,
      ballYellowPressed: `${basePath}/balls/ball-yellow-pressed.webp`,
      ballYellowSelected: `${basePath}/balls/ball-yellow-selected.webp`,
      ballYellowTransparent: `${basePath}/balls/ball-yellow-transparent.webp`,
      ballYellowWinner: `${basePath}/balls/ball-yellow-winner.webp`,
    },
    borders: {
      borderFocused: `${basePath}/borders/border-focused.webp`,
      borderGlass: `${basePath}/borders/border-glass.webp`,
      borderNeonBlue: `${basePath}/borders/border-neon-blue.webp`,
      borderNeonGold: `${basePath}/borders/border-neon-gold.webp`,
      borderWinner: `${basePath}/borders/border-winner.webp`,
    },
    cards: {
      cardInfo: `${basePath}/cards/card-info.webp`,
      cardJackpot: `${basePath}/cards/card-jackpot.webp`,
      cardPlayer: `${basePath}/cards/card-player.webp`,
      cardPrize: `${basePath}/cards/card-prize.webp`,
      cardRanking: `${basePath}/cards/card-ranking.webp`,
      cardSection: `${basePath}/cards/card-section.webp`,
      cardTableHeader: `${basePath}/cards/card-table-header.webp`,
      cardTableRow: `${basePath}/cards/card-table-row.webp`,
      cardTicket: `${basePath}/cards/card-ticket.webp`,
    },
    decorative: {
      decoCornerTlBlue: `${basePath}/decorative/deco-corner-tl-blue.webp`,
      decoCornerTlGold: `${basePath}/decorative/deco-corner-tl-gold.webp`,
      decoCornerTrGold: `${basePath}/decorative/deco-corner-tr-gold.webp`,
    },
    effects: {
      effectBloom: `${basePath}/effects/effect-bloom.webp`,
      effectGlassHighlight: `${basePath}/effects/effect-glass-highlight.webp`,
      effectGlowBlue: `${basePath}/effects/effect-glow-blue.webp`,
      effectGlowGold: `${basePath}/effects/effect-glow-gold.webp`,
      effectInnerGlow: `${basePath}/effects/effect-inner-glow.webp`,
      effectLightBurst: `${basePath}/effects/effect-light-burst.webp`,
      effectLightSweep: `${basePath}/effects/effect-light-sweep.webp`,
      effectOuterGlow: `${basePath}/effects/effect-outer-glow.webp`,
      effectReflection: `${basePath}/effects/effect-reflection.webp`,
      effectShine: `${basePath}/effects/effect-shine.webp`,
    },
    panels: {
      panelDark: `${basePath}/panels/panel-dark.webp`,
      panelFooter: `${basePath}/panels/panel-footer.webp`,
      panelGlass: `${basePath}/panels/panel-glass.webp`,
      panelHeader: `${basePath}/panels/panel-header.webp`,
      panelMain: `${basePath}/panels/panel-main.webp`,
      panelModal: `${basePath}/panels/panel-modal.webp`,
      panelNeon: `${basePath}/panels/panel-neon.webp`,
      panelPopup: `${basePath}/panels/panel-popup.webp`,
      sidebar: `${basePath}/panels/panel-sidebar.webp`,
    },
    particles: {
      particleBlue: `${basePath}/particles/particle-blue.webp`,
      particleConfetti: `${basePath}/particles/particle-confetti.webp`,
      particleDust: `${basePath}/particles/particle-dust.webp`,
      particleGlowDots: `${basePath}/particles/particle-glow-dots.webp`,
      particleGold: `${basePath}/particles/particle-gold.webp`,
      particleSingleBlue: `${basePath}/particles/particle-single-blue.webp`,
      particleSingleGold: `${basePath}/particles/particle-single-gold.webp`,
      particleSingleSparkle: `${basePath}/particles/particle-single-sparkle.webp`,
      particleSingleWhite: `${basePath}/particles/particle-single-white.webp`,
      particleSparkles: `${basePath}/particles/particle-sparkles.webp`,
      particleStars: `${basePath}/particles/particle-stars.webp`,
    },
    textures: {
      textureBlue: `${basePath}/textures/texture-blue.webp`,
      textureDark: `${basePath}/textures/texture-dark.webp`,
      textureGlass: `${basePath}/textures/texture-glass.webp`,
      textureGradientOverlay: `${basePath}/textures/texture-gradient-overlay.webp`,
      textureNoise: `${basePath}/textures/texture-noise.webp`,
      textureSpace: `${basePath}/textures/texture-space.webp`,
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


