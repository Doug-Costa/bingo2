/**
 * Vocabulário próprio do tema Loteria'i (espanhol). Só as chaves que mudam;
 * o resto cai no `es` (fallback do i18next). O Bingo Show Paraguay usa o `es`
 * puro, sem estas trocas.
 */
import type { Dictionary } from './pt-BR';

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

const esLoteriai: DeepPartial<Dictionary> = {
  lobby: {
    grandPrize: 'POZO ACUMULADO',
    grandPrizeJackpot: 'POZO ACUMULADO',
  },
  draw: {
    drawnNumber: 'BOLILLAS SORTEADAS',
    lastNumbersL1: 'ÚLTIMAS',
    nextNumbersL1: 'PRÓXIMAS',
    numbersL2: 'BOLILLAS',
    ballCount: 'BOLILLA SORTEADA {{n}}/{{total}}',
    lastDrawn: 'ÚLTIMAS BOLILLAS SORTEADAS',
  },
  prize: {
    line1: 'LÍNEA',
    line2: '2 LÍNEAS',
    bingo: 'Y LLENO',
    jackpot: 'POZO ACUMULADO',
    oneLine: 'LÍNEA',
    twoLines: '2 LÍNEAS',
  },
  round: {
    title: 'GANADORES DE LA RONDA',
  },
  coupons: {
    coupon: 'BOLETA',
  },
  status: {
    waiting: 'AGUARDANDO',
  },
  meta: {
    donation: 'VALOR',
  },
  winner: {
    coupon: 'BOLETA {{c}}',
  },
};

export default esLoteriai;
