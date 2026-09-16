//src/features/bingo-show/hooks/useBingoShowRealtimeLobby.ts
import { useEffect, useMemo, useState } from 'react';
import { useGameSocket, DrawSSE } from '@/contexts/SSEContext';
import { BingoShowLobbyMock, NextDrawItem } from '../mocks/lobbyMock';
import { formatBrl, formatDrawTime } from '../utils/format';

const FALLBACK_MODALITY = 'BINGO SHOW TRADICIONAL';
const FALLBACK_PROMO = 'COMPRE SUAS CARTELAS COM OS AGENTES AUTORIZADOS • BOA SORTE!';

export interface BingoShowRealtimeLobby extends BingoShowLobbyMock {
  connected: boolean;
}

export function useBingoShowRealtimeLobby(): BingoShowRealtimeLobby {
  const { connected, jackpotAmount, triggerBallLimit, nextDraws, promotions, drawClosingSeconds } = useGameSocket();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return useMemo<BingoShowRealtimeLobby>(() => {
    const current: DrawSSE | undefined = nextDraws[0];
    const drawIdText = current?.incrementalId !== undefined ? String(current.incrementalId) : '---';

    const countdownSeconds = (() => {
      const sched = current?.scheduledAt || (current as any)?.scheduled_at;
      if (!sched) {
        return typeof drawClosingSeconds === 'number' && drawClosingSeconds > 0 ? drawClosingSeconds : 0;
      }
      const dateStr = typeof sched === 'string' ? sched.replace(' ', 'T') : sched;
      const target = new Date(dateStr).getTime();
      if (Number.isNaN(target)) {
        return typeof drawClosingSeconds === 'number' && drawClosingSeconds > 0 ? drawClosingSeconds : 0;
      }
      const scheduledRemaining = Math.max(0, Math.ceil((target - now.getTime()) / 1000));
      return scheduledRemaining;
    })();

    const mappedNextDraws: NextDrawItem[] = nextDraws.slice(0, 10).map((d, idx) => ({
      id: d.id,
      number: d.incrementalId !== undefined ? `#${d.incrementalId}` : '#---',
      time: formatDrawTime(d.scheduledAt),
      isNext: idx === 0,
      line1Prize: formatBrl(d.prizeLine1),
      line2Prize: formatBrl(d.prizeLine2),
      bingoPrize: formatBrl(d.prizeLine3),
    }));

    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();

    const promotionalMessage = promotions[0]?.title || FALLBACK_PROMO;

    return {
      connected,
      drawNumber: drawIdText !== '---' ? `SORTEIO #${drawIdText}` : 'SORTEIO EM BREVE',
      drawNumberShort: drawIdText !== '---' ? `#${drawIdText}` : '#---',
      countdownSeconds,
      accumulatedPrize: formatBrl(jackpotAmount),
      triggerBallLimit: triggerBallLimit ?? 45,
      line1Prize: formatBrl(current?.prizeLine1),
      line2Prize: formatBrl(current?.prizeLine2),
      bingoPrize: formatBrl(current?.prizeLine3),
      nextDraws: mappedNextDraws,
      promotionalMessage,
      currentTime: `${hh}:${mi}:${ss}`,
      currentDate: `${dd}/${mo}/${yyyy}`,
      modalityName: FALLBACK_MODALITY,
    };
  }, [connected, jackpotAmount, triggerBallLimit, nextDraws, promotions, drawClosingSeconds, now]);
}

export default useBingoShowRealtimeLobby;
