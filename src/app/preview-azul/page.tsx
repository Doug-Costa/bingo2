'use client';

/**
 * `/preview-azul` — prévia do tema Bingo Show Azul com dados de exemplo, sem
 * PIN nem backend (para ver o tema no deploy da Vercel e mostrar à equipe).
 *
 * O tema é forçado só nesta página (contexto próprio): não grava nada no
 * localStorage nem muda o tema salvo da TV. Uma bola nova sai a cada 4s;
 * `?cartelas=1` mostra também o quadro "MINHAS CARTELAS"; `?lobby=1` mostra o
 * lobby (próximos sorteios) com a contagem regressiva andando; `?ganhador=N`
 * mostra o popup de ganhador com N ganhadores (1, 2, 5...); `?resumo=1` mostra
 * o resumo "Ganhadores da Rodada"; `?fila=N` (com lobby=1) põe N sorteios na fila
 * (0 a 12; padrão 6).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { TvViewport } from '@/components/tv/TvViewport';
import { TvStage } from '@/components/tv/TvStage';
import ThemeContext from '@/contexts/ThemeContext';
import { AVAILABLE_THEMES, resolveTheme } from '@/theme/themes';
import { BingoShowAmbientBackground } from '@/features/bingo-show/components/BingoShowAmbientBackground';
import { AzulDrawView, type AzulDrawData } from '@/features/bingo-show/components/azul/AzulDrawScreen';
import { AzulLobbyView, type AzulLobbyData } from '@/features/bingo-show/components/azul/AzulLobbyScreen';
import type { DrawSSE } from '@/contexts/SSEContext';
import { formatCountdown } from '@/features/bingo-show/utils/countdown';
import { WinnerAzul } from '@/features/bingo-show/components/azul/WinnerAzul';
import { RoundWinnersAzul } from '@/features/bingo-show/components/azul/RoundWinnersAzul';
import type { GroupWinnerView } from '@/features/bingo-show/components/BingoShowWinnerGroupBlue';
import { formatBrl } from '@/features/bingo-show/utils/format';

const THEME_ID = 'bingo-show-azul';

// Ordem fixa de sorteio (mesma a cada recarga) e 30 bolas já sorteadas na abertura.
const ORDER = [
  1, 38, 12, 41, 14, 42, 16, 43, 17, 53, 54, 60, 67, 69, 71, 19, 25, 28, 29, 32, 34, 73, 76, 81, 82, 83, 84, 86, 90, 6,
  3, 47, 58, 10, 64, 7, 62, 79, 40, 20, 4, 31, 59, 5, 63, 37, 78, 70, 57, 68, 72, 9, 44, 75, 30, 33, 2, 8, 11, 13,
];
const START = 30;

const PLAYERS: { coupon: string; donor: string; numbers: number[] }[] = [
  { coupon: '88233', donor: 'RENATO SILVA', numbers: [20, 4, 31] },
  { coupon: '88234', donor: 'BAR DA MARIA', numbers: [59, 5, 40] },
  { coupon: '88241', donor: 'CHOPERIA E ZECA', numbers: [63, 37, 78] },
  { coupon: '88244', donor: 'RECANTO DA JÃO', numbers: [70, 57, 68] },
  { coupon: '88246', donor: 'VICTOR MONTEIRO', numbers: [72, 9, 44] },
  { coupon: '88231', donor: 'CANTO DA BEL', numbers: [3, 40, 62, 79] },
  { coupon: '88228', donor: "PÉROLA'S COVIL", numbers: [63, 9, 30, 75] },
  { coupon: '88229', donor: 'LEANDRO RAMOS', numbers: [47, 68, 33, 59] },
  { coupon: '88235', donor: 'ADEGA DO TONHO', numbers: [7, 64, 10, 62] },
  { coupon: '88237', donor: 'MERCADINHO BOM', numbers: [10, 47, 57, 58, 2] },
];

const TICKETS = [
  { id: 't1', name: 'Cartela 1', numbers: [[3, 12, 25, 47, 63], [7, 19, 38, 58, 71], [9, 28, 44, 62, 84]] },
  { id: 't2', name: 'Cartela 2', numbers: [[1, 16, 33, 52, 69], [5, 21, 41, 60, 76], [11, 29, 48, 67, 90]] },
];

// Fila de exemplo do lobby: 6 sorteios a cada 10 min (2 páginas de 3).
const LOBBY_DRAWS: DrawSSE[] = Array.from({ length: 12 }, (_, i) => ({
  id: `d${i}`,
  incrementalId: 4910 + i,
  scheduledAt: `2026-11-18 ${String(14 + Math.floor((50 + i * 10) / 60)).padStart(2, '0')}:${String((50 + i * 10) % 60).padStart(2, '0')}:00`,
  prizeLine1: 50000,
  prizeLine2: 100000,
  prizeLine3: 150000,
}));

const WINNER_NAMES = ['Ribas', 'BAR DA MARIA', 'Renato Silva', 'Choperia do Zeca', 'Leandro Ramos', 'Mercadinho Bom'];

function mockWinners(n: number, prize: string): GroupWinnerView[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `w${i}`,
    name: WINNER_NAMES[i % WINNER_NAMES.length]!,
    coupon: String(90025 + i * 7),
    prize,
    jackpot: false,
    cardNumbers: [
      [36, 40, 54, 71, 90],
      [34, 49, 81, 82, 86],
      [2, 11, 33, 51, 75],
    ],
    paintedRows: [0, 1],
  }));
}

export default function PreviewAzulPage() {
  const [count, setCount] = useState(START);
  const [withTickets, setWithTickets] = useState(false);
  const [lobbyMode, setLobbyMode] = useState(false);
  const [secs, setSecs] = useState(133);
  const [winnerCount, setWinnerCount] = useState(0);
  const [summary, setSummary] = useState(false);
  const [queueSize, setQueueSize] = useState(6);

  useEffect(() => {
    setWithTickets(/[?&]cartelas=1/.test(window.location.search));
    setLobbyMode(/[?&]lobby=1/.test(window.location.search));
    setWinnerCount(Number((/[?&]ganhador=(\d+)/.exec(window.location.search) ?? [])[1] ?? 0));
    setSummary(/[?&]resumo=1/.test(window.location.search));
    const fila = (/[?&]fila=(\d+)/.exec(window.location.search) ?? [])[1];
    if (fila !== undefined) setQueueSize(Math.min(12, Number(fila)));
    const timer = setInterval(() => setCount((c) => (c >= ORDER.length ? START : c + 1)), 4000);
    const tick = setInterval(() => setSecs((s) => (s <= 0 ? 180 : s - 1)), 1000);
    return () => {
      clearInterval(timer);
      clearInterval(tick);
    };
  }, []);

  const lobbyData: AzulLobbyData = {
    nextNumber: '4910',
    date: '18/11/2026',
    accumulatedPrize: formatBrl(50000),
    hasLimit: true,
    triggerBallLimit: 68,
    countdown: formatCountdown(secs),
    line1Prize: formatBrl(50000),
    line2Prize: formatBrl(100000),
    bingoPrize: formatBrl(150000),
    draws: LOBBY_DRAWS.slice(0, queueSize),
    message: 'SUA SORTE, NOSSO BINGO! BOA SORTE!',
  };

  const themeValue = useMemo(
    () => ({
      themeId: THEME_ID,
      theme: resolveTheme(THEME_ID),
      setThemeId: () => {},
      availableThemes: AVAILABLE_THEMES,
      isBlue: true,
      isAzul: true,
    }),
    [],
  );

  const data: AzulDrawData = useMemo(() => {
    const drawnBalls = ORDER.slice(0, count);
    const drawn = new Set(drawnBalls);
    const coupons = PLAYERS.map((p) => ({ coupon: p.coupon, donor: p.donor, missing: p.numbers.filter((n) => !drawn.has(n)) }))
      .filter((c) => c.missing.length > 0)
      .sort((a, b) => a.missing.length - b.missing.length);
    return {
      drawNumber: '4909',
      donationAmount: formatBrl(1000),
      currentBall: drawnBalls[drawnBalls.length - 1] ?? 0,
      drawnBalls,
      totalBalls: 90,
      accumulatedPrize: formatBrl(50000),
      triggerBallLimit: 74,
      jackpotActive: true,
      line1Prize: formatBrl(50000),
      line1Status: 'PREMIADO',
      line2Prize: formatBrl(100000),
      line2Status: 'EM DISPUTA',
      bingoPrize: formatBrl(150000),
      bingoStatus: 'ACUMULADO',
      dateStr: '16/11/2026',
      timeStr: '21:30',
      coupons,
      tickets: withTickets ? TICKETS : [],
    };
  }, [count, withTickets]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <TvViewport>
        <TvStage>
          <BingoShowAmbientBackground brightness="light">
            {lobbyMode ? <AzulLobbyView data={lobbyData} /> : <AzulDrawView data={data} />}
            {winnerCount > 0 && (
              <WinnerAzul
                sealText="2º PRÊMIO • 2 LINHAS"
                prizeType="line2"
                winners={mockWinners(winnerCount, formatBrl(winnerCount > 1 ? 100000 / winnerCount : 73.68))}
              />
            )}
            {summary && (
              <RoundWinnersAzul
                drawNumber="4909"
                dateStr="18/11/2026"
                timeStr="21:30"
                jackpotAmount={formatBrl(50000)}
                totalDurationMs={20000}
                onClose={() => setSummary(false)}
                categories={[
                  { key: 'line1', winners: [{ id: 'a', name: 'Ribas', coupon: '90025', prize: formatBrl(50000), jackpot: false }] },
                  {
                    key: 'line2',
                    winners: [
                      { id: 'b', name: 'BAR DA MARIA', coupon: '88234', prize: formatBrl(50000), jackpot: false },
                      { id: 'c', name: 'Renato Silva', coupon: '88233', prize: formatBrl(50000), jackpot: false },
                    ],
                  },
                  { key: 'bingo', winners: [] },
                ]}
              />
            )}
          </BingoShowAmbientBackground>
        </TvStage>
      </TvViewport>
    </ThemeContext.Provider>
  );
}
