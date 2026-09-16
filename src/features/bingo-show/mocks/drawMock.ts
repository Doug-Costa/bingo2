/**
 * drawMock.ts — Dados mockados estáticos fiéis à referência visual 99% do Bingo Show V2.
 */

export type PrizeStatusType =
  | 'EM DISPUTA'
  | 'PRÓXIMO'
  | 'ACUMULADO'
  | 'PREMIADO';

export interface CouponItem {
  coupon: string;
  donor: string;
  missing: number[];
}

export interface TicketCardItem {
  id: string;
  name: string;
  numbers: number[][];
}

export interface BingoShowDrawMock {
  drawNumber: string;
  donationAmount: string;
  currentBall: number;
  currentLetter: string;
  nextBalls: { number: number; color: string }[];
  drawnBalls: number[];
  remainingBalls: number;
  totalBalls: number;
  accumulatedPrize: string;
  line1Prize: string;
  line1Status: PrizeStatusType;
  line2Prize: string;
  line2Status: PrizeStatusType;
  bingoPrize: string;
  bingoStatus: PrizeStatusType;
  triggerBallLimit: number;
  nextNumberCountdownSeconds: number;
  dateStr: string;
  timeStr: string;
  currentTimeStr: string;
  modalityName: string;
  slogan: string;
  coupons: CouponItem[];
  tickets: TicketCardItem[];
}

export function getBallLetter(num: number): string {
  if (num <= 15) {
    return 'B';
  }
  if (num <= 30) {
    return 'I';
  }
  if (num <= 45) {
    return 'N';
  }
  if (num <= 60) {
    return 'G';
  }
  return 'O';
}

export const bingoShowDrawMock: BingoShowDrawMock = {
  drawNumber: '465149',
  donationAmount: 'GS. 2.000',
  currentBall: 11,
  currentLetter: getBallLetter(11),
  nextBalls: [
    { number: 30, color: '#E53935' },
    { number: 65, color: '#FFB300' },
    { number: 90, color: '#8E24AA' },
  ],
  drawnBalls: [
    11, 30, 65, 90, 12, 35, 48, 61, 72, 5, 19, 33, 41, 55, 68, 82, 3, 14, 27,
    49, 70, 88,
  ],
  remainingBalls: 68,
  totalBalls: 90,
  accumulatedPrize: 'GS. 50.000.000',
  line1Prize: 'GS. 1.500.000',
  line1Status: 'EM DISPUTA',
  line2Prize: 'GS. 2.500.000',
  line2Status: 'PRÓXIMO',
  bingoPrize: 'GS. 10.000.000',
  bingoStatus: 'ACUMULADO',
  triggerBallLimit: 45,
  nextNumberCountdownSeconds: 3,
  dateStr: '05/08/2026',
  timeStr: '18:00',
  currentTimeStr: '18:00:00',
  modalityName: 'BINGO SHOW TRADICIONAL',
  slogan: 'TRANSMISSÃO AO VIVO',
  coupons: [
    { coupon: '#0482', donor: 'Carlos M.', missing: [14, 77] },
    { coupon: '#1290', donor: 'Ana P.', missing: [42] },
    { coupon: '#0831', donor: 'Roberto S.', missing: [5, 23, 89] },
  ],
  tickets: [],
};
