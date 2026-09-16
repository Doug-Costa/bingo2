/**
 * responsive.ts — porte de `tvapp1/src/theme/responsive.ts`.
 *
 * Lógica pura (sem componente), portada 1:1 — só `Platform.isTV` (global
 * RN, detecta Android TV/tvOS) não tem equivalente no browser. Como este
 * app roda inteiro dentro do palco lógico 1920×1080 do `TvStage` (Fase 1:
 * `scale = min(vw/1920, vh/1080)`, nunca redimensiona colunas/elementos
 * individualmente), o parâmetro `forcedIsTV` aqui default `true` — é
 * sempre um contexto de TV, nunca mobile/tablet, então o perfil resolvido
 * na prática é sempre `'tv1080'` (ou os vizinhos 4k/1440/720 se alguém
 * passar dimensões fora do padrão). Nenhum threshold/valor numérico foi
 * alterado.
 */

export type LayoutProfile =
  | 'tv4k'
  | 'tv1440'
  | 'tv1080'
  | 'tv720'
  | 'tablet'
  | 'mobileLandscape'
  | 'mobilePortrait';

export interface LayoutMetrics {
  profile: LayoutProfile;
  width: number;
  height: number;
  isLandscape: boolean;
  isTV: boolean;
  scaleFactor: number;
}

/** Detecta o perfil de layout ativo com base nas dimensões e "plataforma". */
export function getLayoutProfile(
  width: number,
  height: number,
  forcedIsTV: boolean = true,
): LayoutProfile {
  const isTV = forcedIsTV;
  const isLandscape = width >= height;

  if (isTV) {
    if (width >= 3840 || height >= 2160) {
      return 'tv4k';
    }
    if (width >= 2560 || height >= 1440) {
      return 'tv1440';
    }
    if (width >= 1920 || height >= 1080) {
      return 'tv1080';
    }
    return 'tv720';
  }

  if (width >= 768 && height >= 768) {
    return 'tablet';
  }

  if (isLandscape) {
    return 'mobileLandscape';
  }

  return 'mobilePortrait';
}

/** Fator de escala base por perfil. */
export function getScaleFactor(profile: LayoutProfile): number {
  switch (profile) {
    case 'tv4k':
      return 2.0;
    case 'tv1440':
      return 1.4;
    case 'tv1080':
      return 1.0;
    case 'tv720':
      return 0.75;
    case 'tablet':
      return 0.85;
    case 'mobileLandscape':
      return 0.65;
    case 'mobilePortrait':
      return 0.55;
    default:
      return 1.0;
  }
}

/** Escala um valor numérico (tamanhos, margens) de acordo com o perfil. */
export function scaleSize(size: number, profile: LayoutProfile): number {
  const factor = getScaleFactor(profile);
  return Math.round(size * factor);
}

/** Escala o tamanho de fontes garantindo limites mínimos de legibilidade. */
export function scaleFont(size: number, profile: LayoutProfile): number {
  const factor = getScaleFactor(profile);
  const minFont = profile === 'mobilePortrait' ? 9 : 10;
  return Math.max(minFont, Math.round(size * factor));
}

export type BallSizeState = 'grid' | 'history' | 'card' | 'current' | 'winner' | 'ticket' | 'modal';

const BALL_SIZES: Record<BallSizeState, Partial<Record<LayoutProfile, number>>> = {
  current: { tv4k: 300, tv1440: 220, tv1080: 170, tv720: 120, tablet: 130, mobileLandscape: 96, mobilePortrait: 90 },
  winner: { tv4k: 360, tv1440: 260, tv1080: 190, tv720: 140, tablet: 150, mobileLandscape: 110, mobilePortrait: 105 },
  history: { tv4k: 96, tv1440: 74, tv1080: 58, tv720: 42, tablet: 46, mobileLandscape: 34, mobilePortrait: 32 },
  grid: { tv4k: 64, tv1440: 48, tv1080: 38, tv720: 28, tablet: 34, mobileLandscape: 24, mobilePortrait: 26 },
  ticket: { tv4k: 54, tv1440: 42, tv1080: 32, tv720: 24, tablet: 28, mobileLandscape: 22, mobilePortrait: 20 },
  modal: { tv4k: 160, tv1440: 120, tv1080: 90, tv720: 64, tablet: 72, mobileLandscape: 56, mobilePortrait: 50 },
  card: { tv4k: 80, tv1440: 60, tv1080: 48, tv720: 36, tablet: 40, mobileLandscape: 30, mobilePortrait: 28 },
};

/** Diâmetro padronizado da bola por estado semântico e perfil. */
export function getBallSize(state: BallSizeState, profile: LayoutProfile): number {
  const table = BALL_SIZES[state] ?? BALL_SIZES.card;
  return table[profile] ?? BALL_SIZES.card[profile] ?? 48;
}

/** Calcula colunas e tamanhos de célula para a grade de 90 números dinamicamente. */
export function getGridMetrics(
  availableWidth: number,
  // eslint-disable-next-line no-unused-vars -- porte 1:1 do RN: parâmetro não usado no original também, mantido só pela paridade de assinatura com quem chama (`NumberGrid`).
  _availableHeight: number,
  profile: LayoutProfile,
): { columns: number; rows: number; cellSize: number; gap: number } {
  let defaultCols = 18;
  if (profile === 'mobilePortrait') {
    defaultCols = 9;
  } else if (profile === 'tablet') {
    defaultCols = 10;
  } else if (profile === 'mobileLandscape') {
    defaultCols = 15;
  }

  const columns = defaultCols;
  const rows = Math.ceil(90 / columns);
  const gap = profile === 'tv4k' ? 6 : profile === 'tv1080' ? 4 : 2;

  const totalHorizontalGap = (columns + 1) * gap;
  const maxCellW = Math.floor((availableWidth - totalHorizontalGap) / columns);

  const baseSize = getBallSize('grid', profile);
  const cellSize = Math.max(16, Math.min(baseSize, maxCellW));

  return { columns, rows, cellSize, gap };
}
