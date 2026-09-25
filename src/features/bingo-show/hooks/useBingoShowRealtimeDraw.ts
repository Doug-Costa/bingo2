//src/features/bingo-show/hooks/useBingoShowRealtimeDraw.ts
import { useEffect, useMemo, useState } from 'react';
import { useGameSocket, type MyTicket, type WinnerEvent } from '@/contexts/SSEContext';
import { CouponItem, TicketCardItem, getBallLetter } from '../mocks/drawMock';
import { PrizeRowStatus } from '../components/BingoShowPrizeStatusCard';
import { formatBrl, formatDrawDate, formatDrawTime } from '../utils/format';

function extractCartelaGrids(raw: unknown): number[][][] {
  let value: unknown = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }
  const first = value[0] as unknown;
  if (first && typeof first === 'object' && !Array.isArray(first)) {
    return value
      .map((entry) => {
        const grid = (entry as { numbers?: unknown }).numbers;
        return Array.isArray(grid) ? (grid as number[][]) : null;
      })
      .filter((grid): grid is number[][] => Array.isArray(grid));
  }
  if (Array.isArray(first)) {
    return [value as number[][]];
  }
  return [];
}

function flattenMyTickets(myTickets: MyTicket[]): TicketCardItem[] {
  const items: TicketCardItem[] = [];
  myTickets.forEach((ticket) => {
    const grids = extractCartelaGrids(ticket.numbers);
    grids.forEach((grid, gridIdx) => {
      items.push({
        id: grids.length > 1 ? `${ticket.id}-${gridIdx}` : ticket.id,
        name: `CARTELA ${String(items.length + 1).padStart(2, '0')}`,
        numbers: grid,
      });
    });
  });
  return items;
}

export interface BingoShowRealtimeDraw {
  connected: boolean;
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
  jackpotActive: boolean;
  nextNumberCountdownSeconds: number;
  dateStr: string;
  timeStr: string;
  currentTimeStr: string;
  modalityName: string;
  slogan: string;
  coupons: CouponItem[];
  tickets: TicketCardItem[];
  winners: WinnerEvent[];
  lastDrawEvent: string | null;
  isDrawFinished: boolean;
  /** `false` enquanto o SSEContext ainda está reconciliando o cache restaurado do F5
   * contra o snapshot autoritativo — usado pra impedir que winners restaurados do
   * cache reabram o popup individual (ver PARTE F — CORRIGIR F5 / CACHE / RECOVERY SSE). */
  isLive: boolean;
}

export type PrizeStatusType = 'EM DISPUTA' | 'PRÓXIMO' | 'ACUMULADO' | 'PREMIADO';

export function useBingoShowRealtimeDraw(): BingoShowRealtimeDraw {
  const {
    connected,
    currentBall,
    drawnNumbers,
    jackpotAmount,
    triggerBallLimit,
    topPlayers,
    winners,
    thisDraw,
    nextDraws,
    myTickets,
    lastDrawEvent,
    recoveryPhase,
    topStage,
  } = useGameSocket();

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeDraw = thisDraw || nextDraws[0] || null;

  // Intervalo real configurado pelo backend entre uma bola e a proxima
  // (campo `nextBallTimer`, ja existia em `DrawSSE`/`ThisDrawInfo`/`Draw` mas
  // nunca era lido nem copiado - por isso o contador ficava congelado em um
  // literal fixo abaixo, nunca sobrescrito por nada). So cai no mesmo valor
  // de antes (3) quando o backend genuinamente nao informar nada.
  const ballIntervalSeconds =
    typeof activeDraw?.nextBallTimer === 'number' && activeDraw.nextBallTimer > 0
      ? activeDraw.nextBallTimer
      : 3;

  const [remainingSeconds, setRemainingSeconds] = useState(ballIntervalSeconds);

  // Reinicia a contagem sempre que uma bola nova REALMENTE sai (currentBall
  // muda) ou o intervalo configurado muda - nunca a cada render. O tick usa
  // atualizacao funcional (`prev => ...`) para nao capturar valor antigo em
  // closure, e o cleanup sempre limpa o interval anterior antes de criar um
  // novo (evita acumular varios intervals rodando juntos).
  useEffect(() => {
    setRemainingSeconds(ballIntervalSeconds);
    const id = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [currentBall, ballIntervalSeconds]);

  const currentNum = currentBall ?? 0;
  const currentLetter = getBallLetter(currentNum);

  const nextBalls = useMemo(() => {
    if (drawnNumbers.length <= 1) {
      return [];
    }
    return drawnNumbers.slice(1, 4).map((n) => ({
      number: n,
      color: n <= 18 ? '#E53935' : n <= 36 ? '#FFB300' : n <= 54 ? '#43A047' : n <= 72 ? '#1E88E5' : '#8E24AA',
    }));
  }, [drawnNumbers]);

  const coupons = useMemo<CouponItem[]>(() => {
    if (topPlayers.length === 0) {
      return [];
    }
    return topPlayers.slice(0, 10).map((tp) => ({
      // Prioriza o incrementalId REAL do bilhete (confirmado no payload de `top_winners`);
      // só cai pro sufixo do UUID se o backend não tiver enviado incrementalId neste evento.
      // Sem "#" — o cabeçalho da coluna já diz "CUPOM", o símbolo era redundante.
      coupon:
        tp.incrementalId !== undefined && tp.incrementalId !== null && String(tp.incrementalId).trim() !== ''
          ? String(tp.incrementalId)
          : tp.ticketId
          ? tp.ticketId.slice(-4)
          : '----',
      donor: tp.playerName || 'Jogador',
      missing: tp.missingNumbers || [],
    }));
  }, [topPlayers]);

  const tickets = useMemo(() => flattenMyTickets(myTickets), [myTickets]);

  // Estágio do prêmio vindo do SSE (`snapshot.topWinnersStage` e `top_winners.stage`,
  // atualizado a cada bola). É a fonte que sobrevive a um reload: o snapshot real
  // manda `winners`/`lineWinners` vazios no meio da rodada, mas o estágio correto
  // ("line2" depois do 1º prêmio, "bingo" depois do 2º). Só promove o status —
  // 'finished'/'line1' não marcam nada (é o valor inicial/do cache).
  const stageReachedLine2 = topStage === 'line2' || topStage === 'bingo';
  const stageReachedBingo = topStage === 'bingo';

  const hasLine1Win = winners.some((w) => w.type === 'line1') || stageReachedLine2;
  const hasLine2Win = winners.some((w) => w.type === 'line2') || stageReachedBingo;
  const hasBingoWin = winners.some((w) => w.type === 'jackpot' || w.type === 'bingo');

  const line1StatusUI: PrizeRowStatus = hasLine1Win ? 'completed' : 'active';
  const line2StatusUI: PrizeRowStatus = hasLine2Win ? 'completed' : hasLine1Win ? 'active' : 'pending';
  const bingoStatusUI: PrizeRowStatus = hasBingoWin ? 'completed' : hasLine2Win ? 'active' : 'pending';

  const hasJackpotWon = winners.some(
    (w) => w.type === 'jackpot' || w.jackpotWon === true,
  );
  const hasRealLimit = typeof triggerBallLimit === 'number' && triggerBallLimit > 0;
  const jackpotEligible = hasRealLimit && drawnNumbers.length <= triggerBallLimit;
  const jackpotActive = hasJackpotWon || jackpotEligible;

  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const isFinished = lastDrawEvent === 'draw_finished';

  return {
    connected,
    drawNumber: activeDraw?.incrementalId !== undefined ? String(activeDraw.incrementalId) : '---',
    donationAmount: formatBrl(activeDraw?.ticketPrice),
    currentBall: currentNum,
    currentLetter,
    nextBalls,
    drawnBalls: drawnNumbers,
    remainingBalls: 90 - drawnNumbers.length,
    totalBalls: 90,
    accumulatedPrize: formatBrl(jackpotAmount),
    line1Prize: formatBrl(activeDraw?.prizeLine1),
    line1Status: line1StatusUI === 'active' ? 'EM DISPUTA' : line1StatusUI === 'completed' ? 'PREMIADO' : 'PRÓXIMO',
    line2Prize: formatBrl(activeDraw?.prizeLine2),
    line2Status: line2StatusUI === 'active' ? 'EM DISPUTA' : line2StatusUI === 'completed' ? 'PREMIADO' : 'PRÓXIMO',
    bingoPrize: formatBrl(activeDraw?.prizeLine3),
    bingoStatus: bingoStatusUI === 'active' ? 'EM DISPUTA' : bingoStatusUI === 'completed' ? 'PREMIADO' : 'ACUMULADO',
    triggerBallLimit: triggerBallLimit ?? 0,
    jackpotActive,
    nextNumberCountdownSeconds: remainingSeconds,
    dateStr: formatDrawDate(activeDraw?.scheduledAt),
    timeStr: formatDrawTime(activeDraw?.scheduledAt),
    currentTimeStr: `${hh}:${mi}:${ss}`,
    modalityName: 'BINGO SHOW TRADICIONAL',
    slogan: 'TRANSMISSÃO AO VIVO',
    coupons,
    tickets,
    winners,
    lastDrawEvent,
    isDrawFinished: isFinished,
    isLive: recoveryPhase === 'live',
  };
}

export default useBingoShowRealtimeDraw;
