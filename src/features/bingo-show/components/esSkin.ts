/**
 * esSkin.ts — aparência dos temas da família es-PY (Bingo Show Paraguay e
 * Loteria'i).
 *
 * Os dois temas têm o mesmo palco, as mesmas colunas e o mesmo fluxo; só muda a
 * identidade visual. Em vez de espalhar `isParaguay || isLoteriai`, cada ponto de
 * variação pede a skin do tema ativo: módulos CSS (mesmos nomes de classe),
 * assets e rótulos. A lógica (SSE, fila de bolas, popups, paginação) é única.
 */
import { useAppTheme } from '@/contexts/ThemeContext';
import pyTheme from './paraguay/ParaguayTheme.module.css';
import pyStage from './paraguay/DrawStageParaguay.module.css';
import pyHistory from './paraguay/HistoryParaguay.module.css';
import pyPrize from './paraguay/PrizeStatusParaguay.module.css';
import pyCoupons from './paraguay/CouponsTableParaguay.module.css';
import pyWinner from './paraguay/WinnerParaguay.module.css';
import pyRound from './paraguay/RoundWinnersParaguay.module.css';
import ltTheme from './loteriai/LoteriaiTheme.module.css';
import ltStage from './loteriai/DrawStageLoteriai.module.css';
import ltHistory from './loteriai/HistoryLoteriai.module.css';
import ltPrize from './loteriai/PrizeStatusLoteriai.module.css';
import ltCoupons from './loteriai/CouponsTableLoteriai.module.css';
import ltWinner from './loteriai/WinnerLoteriai.module.css';
import ltRound from './loteriai/RoundWinnersLoteriai.module.css';

type CssModule = { readonly [key: string]: string };

export interface EsSkin {
  id: 'bingo-show-paraguay' | 'loteriai';
  css: {
    theme: CssModule;
    stage: CssModule;
    history: CssModule;
    prize: CssModule;
    coupons: CssModule;
    winner: CssModule;
    round: CssModule;
  };
  art: {
    /** Marca principal (cabeçalho, resumo da rodada, cartelas). */
    logo: string;
    /** Marca secundária ao lado da principal (só o Paraguay). */
    logoSecondary?: string;
    /** Ornamento pequeno dos títulos. */
    ornament: string;
    globe: string;
    /** Peça ao lado do globo no palco. */
    stageCompanion: string;
    jackpot: string;
    hourglass: string;
    meta: { draw: string; donation: string; date: string; time: string };
    round: { line1: string; line2: string; bingo: string };
    /** Popup de ganhador: arte do card único (linha / bingo) e laterais. */
    winnerLine: string;
    winnerBingo: string;
    winnerSide: string;
    /** Ícone do título do resumo da rodada (sem: 🏆). */
    roundTitleIcon?: string;
  };
  /** Cores de textos/pílulas montados inline nos componentes compartilhados. */
  tone: {
    /** Texto sobre os painéis do tema. */
    panelText: string;
    pillBg: string;
    pillBorder: string;
    pillText: string;
    pillGlow: string;
  };
  /** Textos de marca (não traduzidos); o resto vem do i18n (useT). */
  text: {
    /** Marca no título "<marca> AO VIVO" (draw.liveTitle). */
    liveBrand: string;
    /** Slogan fixo da marca; null usa o subtítulo traduzido (draw.liveSubtitle). */
    slogan: string | null;
    /** Nome do prêmio máximo (3º prêmio); null usa o traduzido (prize.bingo). */
    bingoLabel: string | null;
    /** Coluna do nome na tabela de cupons (chave do i18n). */
    playerColumnKey: 'coupons.donor' | 'coupons.player';
    /** Marca no rodapé do resumo da rodada (round.footer). */
    roundBrand: string;
  };
}

const PY = '/themes/bingo-show-paraguay/sm';
const LT = '/themes/loteriai/sm';

export const PARAGUAY_SKIN: EsSkin = {
  id: 'bingo-show-paraguay',
  css: { theme: pyTheme, stage: pyStage, history: pyHistory, prize: pyPrize, coupons: pyCoupons, winner: pyWinner, round: pyRound },
  art: {
    logo: `${PY}/logos/logo-loteriai.png`,
    ornament: `${PY}/decorative/nanduti.png`,
    globe: `${PY}/decorative/globo.png`,
    stageCompanion: `${PY}/decorative/guampa-terere.png`,
    jackpot: `${PY}/decorative/moedas-guarani.png`,
    hourglass: `${PY}/icons/ampulheta.png`,
    meta: {
      draw: `${PY}/decorative/nanduti.png`,
      donation: `${PY}/decorative/moedas-guarani.png`,
      date: `${PY}/decorative/lapacho.png`,
      time: `${PY}/icons/ampulheta.png`,
    },
    round: { line1: `${PY}/decorative/nanduti.png`, line2: `${PY}/decorative/lapacho.png`, bingo: `${PY}/decorative/moedas-guarani.png` },
    winnerLine: `${PY}/decorative/lapacho.png`,
    winnerBingo: `${PY}/decorative/moedas-guarani.png`,
    winnerSide: `${PY}/decorative/lapacho.png`,
  },
  tone: {
    panelText: '#FFFFFF',
    pillBg: 'rgba(6, 21, 45, 0.92)',
    pillBorder: '1.5px solid rgba(233, 169, 26, 0.75)',
    pillText: '#FFFFFF',
    pillGlow: '0 0 12px rgba(255, 179, 0, 0.25)',
  },
  text: {
    liveBrand: 'BINGO',
    slogan: null,
    bingoLabel: null,
    playerColumnKey: 'coupons.donor',
    roundBrand: 'BINGO SHOW PARAGUAY',
  },
};

export const LOTERIAI_SKIN: EsSkin = {
  id: 'loteriai',
  css: { theme: ltTheme, stage: ltStage, history: ltHistory, prize: ltPrize, coupons: ltCoupons, winner: ltWinner, round: ltRound },
  art: {
    logo: `${LT}/logos/logo-loteriai.png`,
    ornament: `${LT}/decorative/trevo.png`,
    globe: `${LT}/decorative/globo-sorteio.png`,
    stageCompanion: `${LT}/decorative/moedas.png`,
    jackpot: `${LT}/decorative/pote-premio.png`,
    hourglass: `${LT}/icons/ampulheta.png`,
    meta: {
      draw: `${LT}/decorative/ferradura.png`,
      donation: `${LT}/decorative/moedas.png`,
      date: `${LT}/decorative/trevo.png`,
      time: `${LT}/icons/ampulheta.png`,
    },
    round: { line1: `${LT}/decorative/moedas.png`, line2: `${LT}/decorative/pote-premio.png`, bingo: `${LT}/decorative/trofeu.png` },
    winnerLine: `${LT}/decorative/trofeu.png`,
    winnerBingo: `${LT}/decorative/trofeu.png`,
    winnerSide: `${LT}/decorative/trevo.png`,
    roundTitleIcon: `${LT}/decorative/trofeu.png`,
  },
  tone: {
    panelText: '#08245C',
    pillBg: 'linear-gradient(180deg, #fffbea 0%, #fff1c2 100%)',
    pillBorder: '1.5px solid rgba(180, 101, 0, 0.72)',
    pillText: '#08245C',
    pillGlow: '0 3px 8px rgba(104, 57, 0, 0.28)',
  },
  text: {
    liveBrand: "LOTERIA'I",
    slogan: '¡BUENO, BONITO Y BARATO!',
    bingoLabel: "LOTERIA'I",
    playerColumnKey: 'coupons.player',
    roundBrand: "LOTERIA'I • ¡BUENO, BONITO Y BARATO!",
  },
};

/** Skin do tema, ou null se o tema não é da família es-PY. */
export function getEsSkin(themeId: string): EsSkin | null {
  if (themeId === 'loteriai') return LOTERIAI_SKIN;
  if (themeId === 'bingo-show-paraguay') return PARAGUAY_SKIN;
  return null;
}

/** Para os componentes que só existem na família es-PY (popups, fundo). */
export function useEsSkin(): EsSkin {
  const { themeId } = useAppTheme();
  return getEsSkin(themeId) ?? PARAGUAY_SKIN;
}
