/**
 * Bingo Show V2 — Design System Animations
 * Porte 1:1 do RN. Nenhum número alterado.
 *
 * `spring.*` (tension/friction) é o modelo de mola do Reanimated — não existe
 * conceito direto em CSS puro. Preservado aqui por rastreabilidade; se algum
 * componente precisar de easing "spring-like" em CSS, ele deve ser convertido
 * para uma curva `cubic-bezier` equivalente na Fase 2/3 (mencionar caso a
 * caso, quando o componente real for portado — não decidido antecipadamente
 * aqui).
 */

export const BingoShowAnimations = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    verySlow: 800,
    modalEntry: 400,
    slideCycle: 15000,
  },

  spring: {
    bouncy: { tension: 120, friction: 6 },
    gentle: { tension: 80, friction: 10 },
    stiff: { tension: 200, friction: 15 },
  },

  loop: {
    pulseDuration: 1000,
    bounceDuration: 600,
    shineDuration: 2000,
  },
} as const;

export type BingoShowAnimationToken = keyof typeof BingoShowAnimations;
