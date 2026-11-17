//src/features/bingo-show/hooks/useBingoShowRealtimeLobby.ts
import { useEffect, useMemo, useState } from 'react';
import { useGameSocket, DrawSSE } from '@/contexts/SSEContext';
import { BingoShowLobbyMock, NextDrawItem } from '../mocks/lobbyMock';
import { formatBrl, formatDrawTime } from '../utils/format';
import { useT } from '@/contexts/TvConfigContext';

export interface BingoShowRealtimeLobby extends BingoShowLobbyMock {
  connected: boolean;
  /** `true` só quando o backend enviou um trigger ball limit válido (> 0).
   * `triggerBallLimit` continua caindo em 45 para quem já depende disso; o lobby
   * Blue usa esta flag para não exibir um número que não veio do backend. */
  hasTriggerBallLimit: boolean;
}

/** Segundos até o próximo sorteio (horário agendado; sem ele, o `draw_closing`). */
export function computeCountdownSeconds(current: DrawSSE | undefined, drawClosingSeconds: unknown, nowMs: number): number {
  const fallback = typeof drawClosingSeconds === 'number' && drawClosingSeconds > 0 ? drawClosingSeconds : 0;
  const sched = current?.scheduledAt || (current as any)?.scheduled_at;
  if (!sched) return fallback;
  const target = new Date(typeof sched === 'string' ? sched.replace(' ', 'T') : sched).getTime();
  if (Number.isNaN(target)) return fallback;
  return Math.max(0, Math.ceil((target - nowMs) / 1000));
}

/**
 * `tick: false` — sem o relógio de 1s aqui dentro: a tela usa componentes com
 * relógio próprio (só o texto do relógio/contador redesenha a cada segundo, não o
 * lobby inteiro). `countdownSeconds`/`currentTime` ficam com o valor da montagem.
 */
export function useBingoShowRealtimeLobby(options: { tick?: boolean } = {}): BingoShowRealtimeLobby {
  const tick = options.tick !== false;
  const { connected, jackpotAmount, triggerBallLimit, nextDraws, promotions, drawClosingSeconds } = useGameSocket();
  const t = useT();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!tick) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [tick]);

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

    const promotionalMessage = promotions[0]?.title || t('lobby.promoFallback');

    return {
      connected,
      drawNumber: drawIdText !== '---' ? t('draw.numbered', { n: `#${drawIdText}` }) : t('draw.soon'),
      drawNumberShort: drawIdText !== '---' ? `#${drawIdText}` : '#---',
      countdownSeconds,
      accumulatedPrize: formatBrl(jackpotAmount),
      triggerBallLimit: triggerBallLimit ?? 45,
      hasTriggerBallLimit: typeof triggerBallLimit === 'number' && triggerBallLimit > 0,
      line1Prize: formatBrl(current?.prizeLine1),
      line2Prize: formatBrl(current?.prizeLine2),
      bingoPrize: formatBrl(current?.prizeLine3),
      nextDraws: mappedNextDraws,
      promotionalMessage,
      currentTime: `${hh}:${mi}:${ss}`,
      currentDate: `${dd}/${mo}/${yyyy}`,
      modalityName: t('draw.modality'),
    };
  }, [connected, jackpotAmount, triggerBallLimit, nextDraws, promotions, drawClosingSeconds, now, t]);
}

export default useBingoShowRealtimeLobby;
