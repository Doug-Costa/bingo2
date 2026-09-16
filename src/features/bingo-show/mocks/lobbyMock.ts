/**
 * lobbyMock.ts — Dados mockados estáticos tipados para o Lobby do Bingo Show V2.
 */

export interface NextDrawItem {
  id: string;
  number: string;
  time: string;
  isNext?: boolean;
  line1Prize: string;
  line2Prize: string;
  bingoPrize: string;
}

export interface BingoShowLobbyMock {
  drawNumber: string;
  drawNumberShort: string;
  countdownSeconds: number;
  accumulatedPrize: string;
  triggerBallLimit: number;
  line1Prize: string;
  line2Prize: string;
  bingoPrize: string;
  nextDraws: NextDrawItem[];
  promotionalMessage: string;
  currentTime: string;
  currentDate: string;
  modalityName: string;
}

export const bingoShowLobbyMock: BingoShowLobbyMock = {
  drawNumber: 'SORTEIO #2214',
  drawNumberShort: '#2214',
  countdownSeconds: 210,
  accumulatedPrize: 'R$ 128.500,00',
  triggerBallLimit: 45,
  line1Prize: 'R$ 4.200,00',
  line2Prize: 'R$ 7.800,00',
  bingoPrize: 'R$ 32.000,00',
  nextDraws: [
    {
      id: '1',
      number: '#2214',
      time: '18:00',
      isNext: true,
      line1Prize: 'R$ 4.200,00',
      line2Prize: 'R$ 7.800,00',
      bingoPrize: 'R$ 32.000,00',
    },
    {
      id: '2',
      number: '#2215',
      time: '18:05',
      line1Prize: 'R$ 3.900,00',
      line2Prize: 'R$ 7.200,00',
      bingoPrize: 'R$ 28.500,00',
    },
    {
      id: '3',
      number: '#2216',
      time: '18:10',
      line1Prize: 'R$ 4.500,00',
      line2Prize: 'R$ 8.100,00',
      bingoPrize: 'R$ 35.000,00',
    },
    {
      id: '4',
      number: '#2217',
      time: '18:15',
      line1Prize: 'R$ 4.000,00',
      line2Prize: 'R$ 7.500,00',
      bingoPrize: 'R$ 30.000,00',
    },
    {
      id: '5',
      number: '#2218',
      time: '18:20',
      line1Prize: 'R$ 5.000,00',
      line2Prize: 'R$ 9.000,00',
      bingoPrize: 'R$ 40.000,00',
    },
  ],
  promotionalMessage: 'COMPRE SUAS CARTELAS COM OS AGENTES AUTORIZADOS • BOA SORTE!',
  currentTime: '18:00:00',
  currentDate: '05/08/2026',
  modalityName: 'BINGO SHOW TRADICIONAL',
};
