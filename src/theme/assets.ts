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

const BASE = '/themes/bingo-show';

export const backgrounds = {
  bgBlueGradient: `${BASE}/backgrounds/bg-blue-gradient.png`,
  bgDark: `${BASE}/backgrounds/bg-dark.png`,
  bgGlow: `${BASE}/backgrounds/bg-glow.png`,
  bgMain: `${BASE}/backgrounds/bg-main.png`,
  bgParticle: `${BASE}/backgrounds/bg-particle.png`,
  bgSpace: `${BASE}/backgrounds/bg-space.png`,
} as const;

export const balls = {
  ballBlueDefault: `${BASE}/balls/ball-blue-default.png`,
  ballBlueFocused: `${BASE}/balls/ball-blue-focused.png`,
  ballBlueGlow: `${BASE}/balls/ball-blue-glow.png`,
  ballBluePressed: `${BASE}/balls/ball-blue-pressed.png`,
  ballBlueSelected: `${BASE}/balls/ball-blue-selected.png`,
  ballBlueTransparent: `${BASE}/balls/ball-blue-transparent.png`,
  ballBlueWinner: `${BASE}/balls/ball-blue-winner.png`,
  ballGoldDefault: `${BASE}/balls/ball-gold-default.png`,
  ballGoldFocused: `${BASE}/balls/ball-gold-focused.png`,
  ballGoldGlow: `${BASE}/balls/ball-gold-glow.png`,
  ballGoldPressed: `${BASE}/balls/ball-gold-pressed.png`,
  ballGoldSelected: `${BASE}/balls/ball-gold-selected.png`,
  ballGoldTransparent: `${BASE}/balls/ball-gold-transparent.png`,
  ballGoldWinner: `${BASE}/balls/ball-gold-winner.png`,
  ballGreenDefault: `${BASE}/balls/ball-green-default.png`,
  ballGreenFocused: `${BASE}/balls/ball-green-focused.png`,
  ballGreenGlow: `${BASE}/balls/ball-green-glow.png`,
  ballGreenPressed: `${BASE}/balls/ball-green-pressed.png`,
  ballGreenSelected: `${BASE}/balls/ball-green-selected.png`,
  ballGreenTransparent: `${BASE}/balls/ball-green-transparent.png`,
  ballGreenWinner: `${BASE}/balls/ball-green-winner.png`,
  ballPurpleDefault: `${BASE}/balls/ball-purple-default.png`,
  ballPurpleFocused: `${BASE}/balls/ball-purple-focused.png`,
  ballPurpleGlow: `${BASE}/balls/ball-purple-glow.png`,
  ballPurplePressed: `${BASE}/balls/ball-purple-pressed.png`,
  ballPurpleSelected: `${BASE}/balls/ball-purple-selected.png`,
  ballPurpleTransparent: `${BASE}/balls/ball-purple-transparent.png`,
  ballPurpleWinner: `${BASE}/balls/ball-purple-winner.png`,
  ballRedDefault: `${BASE}/balls/ball-red-default.png`,
  ballRedFocused: `${BASE}/balls/ball-red-focused.png`,
  ballRedGlow: `${BASE}/balls/ball-red-glow.png`,
  ballRedPressed: `${BASE}/balls/ball-red-pressed.png`,
  ballRedSelected: `${BASE}/balls/ball-red-selected.png`,
  ballRedTransparent: `${BASE}/balls/ball-red-transparent.png`,
  ballRedWinner: `${BASE}/balls/ball-red-winner.png`,
  ballSilverDefault: `${BASE}/balls/ball-silver-default.png`,
  ballSilverFocused: `${BASE}/balls/ball-silver-focused.png`,
  ballSilverGlow: `${BASE}/balls/ball-silver-glow.png`,
  ballSilverPressed: `${BASE}/balls/ball-silver-pressed.png`,
  ballSilverSelected: `${BASE}/balls/ball-silver-selected.png`,
  ballSilverTransparent: `${BASE}/balls/ball-silver-transparent.png`,
  ballSilverWinner: `${BASE}/balls/ball-silver-winner.png`,
  ballYellowDefault: `${BASE}/balls/ball-yellow-default.png`,
  ballYellowFocused: `${BASE}/balls/ball-yellow-focused.png`,
  ballYellowGlow: `${BASE}/balls/ball-yellow-glow.png`,
  ballYellowPressed: `${BASE}/balls/ball-yellow-pressed.png`,
  ballYellowSelected: `${BASE}/balls/ball-yellow-selected.png`,
  ballYellowTransparent: `${BASE}/balls/ball-yellow-transparent.png`,
  ballYellowWinner: `${BASE}/balls/ball-yellow-winner.png`,
} as const;

export const borders = {
  borderFocused: `${BASE}/borders/border-focused.png`,
  borderGlass: `${BASE}/borders/border-glass.png`,
  borderNeonBlue: `${BASE}/borders/border-neon-blue.png`,
  borderNeonGold: `${BASE}/borders/border-neon-gold.png`,
  borderWinner: `${BASE}/borders/border-winner.png`,
} as const;

export const cards = {
  cardInfo: `${BASE}/cards/card-info.png`,
  cardJackpot: `${BASE}/cards/card-jackpot.png`,
  cardPlayer: `${BASE}/cards/card-player.png`,
  cardPrize: `${BASE}/cards/card-prize.png`,
  cardRanking: `${BASE}/cards/card-ranking.png`,
  cardSection: `${BASE}/cards/card-section.png`,
  cardTableHeader: `${BASE}/cards/card-table-header.png`,
  cardTableRow: `${BASE}/cards/card-table-row.png`,
  cardTicket: `${BASE}/cards/card-ticket.png`,
} as const;

export const decorative = {
  decoCornerTlBlue: `${BASE}/decorative/deco-corner-tl-blue.png`,
  decoCornerTlGold: `${BASE}/decorative/deco-corner-tl-gold.png`,
  decoCornerTrGold: `${BASE}/decorative/deco-corner-tr-gold.png`,
} as const;

export const effects = {
  effectBloom: `${BASE}/effects/effect-bloom.png`,
  effectGlassHighlight: `${BASE}/effects/effect-glass-highlight.png`,
  effectGlowBlue: `${BASE}/effects/effect-glow-blue.png`,
  effectGlowGold: `${BASE}/effects/effect-glow-gold.png`,
  effectInnerGlow: `${BASE}/effects/effect-inner-glow.png`,
  effectLightBurst: `${BASE}/effects/effect-light-burst.png`,
  effectLightSweep: `${BASE}/effects/effect-light-sweep.png`,
  effectOuterGlow: `${BASE}/effects/effect-outer-glow.png`,
  effectReflection: `${BASE}/effects/effect-reflection.png`,
  effectShine: `${BASE}/effects/effect-shine.png`,
} as const;

export const panels = {
  panelDark: `${BASE}/panels/panel-dark.png`,
  panelFooter: `${BASE}/panels/panel-footer.png`,
  panelGlass: `${BASE}/panels/panel-glass.png`,
  panelHeader: `${BASE}/panels/panel-header.png`,
  panelMain: `${BASE}/panels/panel-main.png`,
  panelModal: `${BASE}/panels/panel-modal.png`,
  panelNeon: `${BASE}/panels/panel-neon.png`,
  panelPopup: `${BASE}/panels/panel-popup.png`,
  panelSidebar: `${BASE}/panels/panel-sidebar.png`,
} as const;

export const particles = {
  particleBlue: `${BASE}/particles/particle-blue.png`,
  particleConfetti: `${BASE}/particles/particle-confetti.png`,
  particleDust: `${BASE}/particles/particle-dust.png`,
  particleGlowDots: `${BASE}/particles/particle-glow-dots.png`,
  particleGold: `${BASE}/particles/particle-gold.png`,
  particleSingleBlue: `${BASE}/particles/particle-single-blue.png`,
  particleSingleGold: `${BASE}/particles/particle-single-gold.png`,
  particleSingleSparkle: `${BASE}/particles/particle-single-sparkle.png`,
  particleSingleWhite: `${BASE}/particles/particle-single-white.png`,
  particleSparkles: `${BASE}/particles/particle-sparkles.png`,
  particleStars: `${BASE}/particles/particle-stars.png`,
} as const;

export const textures = {
  textureBlue: `${BASE}/textures/texture-blue.png`,
  textureDark: `${BASE}/textures/texture-dark.png`,
  textureGlass: `${BASE}/textures/texture-glass.png`,
  textureGradientOverlay: `${BASE}/textures/texture-gradient-overlay.png`,
  textureNoise: `${BASE}/textures/texture-noise.png`,
  textureSpace: `${BASE}/textures/texture-space.png`,
} as const;
