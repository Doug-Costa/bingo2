/**
 * AzulWinnerPopup.tsx — popups de ganhador e resumo da rodada do tema
 * `bingo-show-azul`, SÓ deste tema (a tela de sorteio do Azul usa este arquivo
 * no lugar do BingoShowWinnerPopup compartilhado, que não foi alterado).
 *
 * A lógica (fila, agrupamento por prêmio, deduplicação, tempos, espera da voz e
 * abertura do resumo) é uma cópia fiel da do BingoShowWinnerPopup, para o Azul
 * se comportar igual aos outros temas; só a apresentação é do Azul
 * (WinnerAzul e RoundWinnersAzul). Se a regra do popup compartilhado mudar,
 * replicar aqui.
 */
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import type { WinnerEvent } from '@/contexts/SSEContext';
import { useT } from '@/contexts/TvConfigContext';
import { formatBrl } from '../../utils/format';
import { FINISH_SCREEN_HOLD_MS, ROUND_SUMMARY_DELAY_MS, ROUND_SUMMARY_MIN_MS, WINNER_POPUP_GAP_MS, WINNER_POPUP_MS } from '../../timing';
import { whenAudioIdle } from '../../hooks/useBingoAudio';
import { setFinishHoldExtraMs } from '../../finishHold';
import { computeRowsToPaint, type BingoShowWinnerPopupProps } from '../BingoShowWinnerPopup';
import { groupDurationMs, GROUP_PAGE_SIZE } from '../BingoShowWinnerGroupBlue';
import type { RoundCategoryView } from '../BingoShowRoundWinnersBlue';
import { WinnerAzul } from './WinnerAzul';
import { RoundWinnersAzul } from './RoundWinnersAzul';

// Remove UUIDs longos e formata identificador limpo de cupom (ex: ABC123) — fallback
// usado só quando não há `incrementalId` real disponível (ver `formatCouponDisplay`). Sem
// "#" — o rótulo "CUPOM" ao lado já diz o que é, o símbolo era redundante.
function cleanTicketId(raw?: string): string {
  if (!raw || !raw.trim()) return '';
  const clean = (raw.split('-')[0] || raw).toUpperCase();
  const digitsOrChars = clean.replace(/[^A-Z0-9]/g, '');
  return digitsOrChars.length > 0 ? digitsOrChars.slice(0, 6) : '';
}

// Identificador visual do cupom: prioriza o `incrementalId` REAL do bilhete (confirmado no
// payload de `top_winners`/`line_winner`, ao lado de `ticketId`/`playerName`) — só cai para
// o UUID mascarado (`cleanTicketId`) se o backend não tiver enviado `incrementalId` neste
// evento específico. `ticketId` nunca é alterado internamente, só a exibição muda.
function formatCouponDisplay(winner: Pick<WinnerEvent, 'ticketId' | 'incrementalId'>): string {
  if (winner.incrementalId !== undefined && winner.incrementalId !== null && String(winner.incrementalId).trim() !== '') {
    return String(winner.incrementalId);
  }
  return cleanTicketId(winner.ticketId);
}

// Normalização estrita de tipo de vencedor (line1, line2, bingo, jackpot -> bingo)

/** Selo do prêmio no idioma da TV. A Loteria'i usa os nomes próprios dos prêmios
 * (línea / 2 líneas / lleno — vocabulário `es-loteriai`) e ordinais próprios. */
function getPrizeDisplay(type: string | undefined, t: TFunction, skinId?: string) {
  const norm = normalizeWinnerType(type) || 'bingo';
  const n = norm === 'line1' ? 1 : norm === 'line2' ? 2 : 3;
  if (skinId === 'loteriai') {
    const order = t(`prize.order${n}Lt`);
    const title = n === 3 ? t('prize.bingo') : t(`prize.line${n}`);
    return { order, title, full: `${order} • ${title}` };
  }
  const order = t(`prize.order${n}`);
  const title = n === 1 ? t('prize.oneLine') : n === 2 ? t('prize.twoLines') : t('prize.bingo');
  return { order, title, full: `${order} • ${title}` };
}

function normalizeWinnerType(type?: string): 'line1' | 'line2' | 'bingo' | null {
  if (!type) return null;
  const lower = type.toLowerCase().trim();
  if (lower === 'jackpot' || lower === 'bingo') return 'bingo';
  if (lower === 'line2') return 'line2';
  if (lower === 'line1') return 'line1';
  return null;
}

// Chave estrita de deduplicação usando ticketId (ou playerName) e tipo normalizado
function winnerKey(w: WinnerEvent): string {
  if (!w) return '';
  const normType = normalizeWinnerType(w.type);
  if (!normType) return '';
  const rawId = w.ticketId && w.ticketId.trim() !== '' ? w.ticketId : w.playerName;
  const identity = (rawId || '').toLowerCase().trim();
  if (!identity) return '';
  return `${identity}-${normType}`;
}

// Reconcilia e desduplica a lista de ganhadores preservando jackpotWon e numbers
function dedupeWinners(list: WinnerEvent[]): WinnerEvent[] {
  const map = new Map<string, WinnerEvent>();
  for (const w of list) {
    if (!w) continue;
    const key = winnerKey(w);
    if (!key) continue;
    const normType = normalizeWinnerType(w.type);
    if (!normType) continue;

    const formattedItem: WinnerEvent = { ...w, type: normType };

    if (map.has(key)) {
      const existing = map.get(key)!;
      map.set(key, {
        ...existing,
        ...formattedItem,
        ticketId: formattedItem.ticketId ?? existing.ticketId,
        playerId: formattedItem.playerId ?? existing.playerId,
        playerName: formattedItem.playerName ?? existing.playerName,
        affiliateName: formattedItem.affiliateName ?? existing.affiliateName,
        incrementalId: formattedItem.incrementalId ?? existing.incrementalId,
        prizeAmount: formattedItem.prizeAmount ?? existing.prizeAmount,
        share: formattedItem.share ?? existing.share,
        prize: formattedItem.prize ?? existing.prize,
        numbers: formattedItem.numbers ?? existing.numbers,
        jackpotWon: formattedItem.jackpotWon ?? existing.jackpotWon,
        drawnNumbersAtWin: formattedItem.drawnNumbersAtWin ?? existing.drawnNumbersAtWin,
        winningLines: formattedItem.winningLines ?? existing.winningLines,
      });
    } else {
      map.set(key, formattedItem);
    }
  }
  const result = Array.from(map.values());
  console.log(`[DEDUPE-AUDIT] RawCount=${list.length} -> DedupedCount=${result.length}`);
  if (list.length !== result.length || result.length > 1) {
    console.log(
      `[DEDUPE-AUDIT] Raw list keys:`,
      list.map((w) => ({ ticketId: w.ticketId, clean: cleanTicketId(w.ticketId), name: w.playerName, type: w.type, key: winnerKey(w) })),
    );
    console.log(
      `[DEDUPE-AUDIT] Result list keys:`,
      result.map((w) => ({ ticketId: w.ticketId, clean: cleanTicketId(w.ticketId), name: w.playerName, type: w.type, key: winnerKey(w) })),
    );
  }
  return result;
}

// Valor Monetário Exclusivo do Backend (sem usar o prêmio total da faixa em SPLIT se prizeAmount não existir)
function getWinnerPrizeDisplay(winner: WinnerEvent, isSplit: boolean, defaultPrizeStr: string, t: TFunction): string {
  const hasValidPrize =
    winner.prizeAmount !== undefined && typeof winner.prizeAmount === 'number' && winner.prizeAmount > 0;
  return hasValidPrize ? formatBrl(winner.prizeAmount!) : isSplit ? t('winner.valueMissing') : defaultPrizeStr;
}

function getWinnerDisplayName(winner: WinnerEvent, t: TFunction): string {
  return winner.playerName && winner.playerName.trim() !== '' ? winner.playerName : t('winner.nameMissing');
}

const AzulWinnerPopupInner: React.FC<BingoShowWinnerPopupProps> = ({
  winners,
  topPlayers: _topPlayers = [],
  isDrawFinished = false,
  drawNumber = '---',
  dateStr = '',
  timeStr = '',
  line1Prize = 'GS. 0',
  line2Prize = 'GS. 0',
  bingoPrize = 'GS. 0',
  jackpotAmount: jackpotAmountGlobal,
  drawnNumbers = [],
  visibleDurationMs: _visibleDurationMs,
  onClose,
  onPrizeShown,
  isLive = true,
}) => {
  const onPrizeShownRef = useRef(onPrizeShown);
  onPrizeShownRef.current = onPrizeShown;
  const t = useT();
  // Popup = GRUPO de ganhadores do mesmo prêmio (1 = popup individual; 2+ = todos
  // juntos, cards menores com cartela). Ver enqueueWinners.
  const [activeGroup, setActiveGroup] = useState<WinnerEvent[] | null>(null);
  const [visible, setVisible] = useState(false);
  const [showFullRoundWinners, setShowFullRoundWinners] = useState(false);

  const seenRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<WinnerEvent[][]>([]);
  const activeGroupRef = useRef<WinnerEvent[] | null>(null);
  const activeDurationRef = useRef(WINNER_POPUP_MS);
  const processingRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Desduplica rigorosamente os ganhadores reconciliando dados reais
  const dedupedWinners = useMemo(() => dedupeWinners(winners), [winners]);

  // Agrupamento estrito por faixa normalizada
  const line1Winners = useMemo(() => dedupedWinners.filter((w) => normalizeWinnerType(w.type) === 'line1'), [dedupedWinners]);
  const line2Winners = useMemo(() => dedupedWinners.filter((w) => normalizeWinnerType(w.type) === 'line2'), [dedupedWinners]);
  const bingoWinners = useMemo(() => dedupedWinners.filter((w) => normalizeWinnerType(w.type) === 'bingo'), [dedupedWinners]);

  // Tempo do resumo: o que sobra da janela do LoopScreen depois do popup do bingo
  // terminar (definido no draw_finish). As páginas se dividem nesse tempo real.
  const [summaryMs, setSummaryMs] = useState(FINISH_SCREEN_HOLD_MS);
  const totalDurationMs = summaryMs;
  const shownAtRef = useRef(0);
  const visibleRef = useRef(false);
  visibleRef.current = visible;
  // Fim da rodada: quando a fila de popups esvaziar, abre o resumo (ver draw_finish).
  const finishingRef = useRef(false);
  const openSummaryRef = useRef<(() => void) | null>(null);
  const dedupedWinnersRef = useRef<WinnerEvent[]>([]);
  dedupedWinnersRef.current = dedupedWinners;

  const hasFinishedForCurrentDrawRef = useRef(false);
  const finalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Espera a voz terminar antes do resumo (cancelável no reset/unmount).
  const cancelAudioWaitRef = useRef<(() => void) | null>(null);

  // Reset por drawNumber para garantir estado limpo na próxima rodada
  useEffect(() => {
    if (finalTimerRef.current) clearTimeout(finalTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    cancelAudioWaitRef.current?.();
    seenRef.current.clear();
    queueRef.current = [];
    processingRef.current = false;
    hasFinishedForCurrentDrawRef.current = false;
    finishingRef.current = false;
    openSummaryRef.current = null;
    setFinishHoldExtraMs(0);
    activeGroupRef.current = null;
    setActiveGroup(null);
    setVisible(false);
    setShowFullRoundWinners(false);
  }, [drawNumber]);

  const processQueue = useCallback(() => {
    if (processingRef.current || queueRef.current.length === 0) return;
    processingRef.current = true;
    const nextGroup = queueRef.current.shift()!;
    activeGroupRef.current = nextGroup;
    setActiveGroup(nextGroup);
    setVisible(true);
    shownAtRef.current = Date.now();
    onPrizeShownRef.current?.(normalizeWinnerType(nextGroup[0]?.type) || 'bingo');
    // Mais de GROUP_PAGE_SIZE ganhadores: uma página a cada WINNER_POPUP_MS.
    const durationMs = groupDurationMs(nextGroup.length);
    activeDurationRef.current = durationMs;

    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      nextTimerRef.current = setTimeout(() => {
        processingRef.current = false;
        // Rodada encerrada e fila vazia: pausa com o painel livre e então o
        // resumo (openSummary ainda espera a voz do prêmio terminar).
        if (finishingRef.current && queueRef.current.length === 0) {
          finishingRef.current = false;
          nextTimerRef.current = setTimeout(() => openSummaryRef.current?.(), ROUND_SUMMARY_DELAY_MS - WINNER_POPUP_GAP_MS);
          return;
        }
        processQueue();
      }, WINNER_POPUP_GAP_MS);
    }, durationMs);
  }, []);

  // Agrupa por prêmio: ganhadores da mesma faixa que chegam juntos (mesmo
  // line_winner), ou enquanto outro grupo da mesma faixa ainda espera na fila,
  // viram UM popup. Um ganhador que chega logo depois (até 1,5s) do popup da
  // mesma faixa abrir entra nele.
  const enqueueWinners = useCallback((events: WinnerEvent[]) => {
    const typeOf = (w: WinnerEvent) => normalizeWinnerType(w.type) || 'bingo';
    const byType = new Map<string, WinnerEvent[]>();
    events.forEach((w) => byType.set(typeOf(w), [...(byType.get(typeOf(w)) ?? []), w]));
    byType.forEach((list, t) => {
      const queued = queueRef.current.find((g) => typeOf(g[0]!) === t);
      if (queued) {
        queued.push(...list);
        return;
      }
      const active = activeGroupRef.current;
      if (
        active &&
        visibleRef.current &&
        typeOf(active[0]!) === t &&
        Date.now() - shownAtRef.current <= 1500 &&
        active.length + list.length <= GROUP_PAGE_SIZE
      ) {
        const merged = [...active, ...list];
        activeGroupRef.current = merged;
        setActiveGroup(merged);
        return;
      }
      queueRef.current.push(list);
    });
  }, []);

  // Fila de exibição individual durante a rodada — enquanto `isLive` é false (F5 ainda
  // reconciliando cache×snapshot), os winners que chegam são RESTAURADOS, não eventos
  // novos: marca como já vistos sem enfileirar popup, áudio ou animação nenhuma. Só
  // depois que `isLive` vira true (snapshot autoritativo confirmou) é que winners
  // realmente novos passam a entrar na fila normalmente.
  useEffect(() => {
    if (isDrawFinished) return;

    if (!isLive) {
      let skippedCount = 0;
      winners.forEach((w) => {
        const key = winnerKey(w);
        if (key && !seenRef.current.has(key)) {
          seenRef.current.add(key);
          skippedCount++;
        }
      });
      if (skippedCount > 0) {
        console.log('[WINNER-RECOVERY]', { cachedWinners: winners.length, skippedQueueCount: skippedCount });
      }
      return;
    }

    const newEvents = winners.filter((w) => {
      const key = winnerKey(w);
      if (!key || seenRef.current.has(key)) return false;
      seenRef.current.add(key);
      return true;
    });

    if (newEvents.length > 0) {
      console.log(`[WINNER-QUEUE] ----------------------------------------`);
      console.log(
        `[WINNER-QUEUE] isDrawFinished=${isDrawFinished} | drawNumber="${drawNumber}" | winners.length=${winners.length} | seenRef.size=${seenRef.current.size} | newEvents.length=${newEvents.length} | queueRef.length=${queueRef.current.length}`,
      );
      console.log(
        `[WINNER-QUEUE] New events queued:`,
        newEvents.map((w) => ({
          ticketIdRAW: w.ticketId,
          cleanTicketId: cleanTicketId(w.ticketId),
          playerName: w.playerName,
          type: w.type,
          winnerKey: winnerKey(w),
        })),
      );
      console.log(`[WINNER-QUEUE] ----------------------------------------`);
      enqueueWinners(newEvents);
      processQueue();
    }
  }, [winners, isDrawFinished, isLive, processQueue, enqueueWinners, drawNumber]);

  // Exibição da Tela Final de Encerramento (Gatilho determinístico protegido via finalTimerRef)
  useEffect(() => {
    if (isDrawFinished && !hasFinishedForCurrentDrawRef.current) {
      hasFinishedForCurrentDrawRef.current = true;
      if (finalTimerRef.current) clearTimeout(finalTimerRef.current);

      // Ganhadores do BINGO que ainda não tiveram popup (ex.: vieram só no
      // draw_finish, ou vários no mesmo line_winner) entram no fim da fila. Os
      // popups já na fila NÃO são descartados — antes, só o 1º ganhador do bingo
      // aparecia e os demais iam direto para o resumo.
      if (isLive) {
        const pendingBingo = dedupedWinnersRef.current.filter((w) => {
          const key = winnerKey(w);
          if (normalizeWinnerType(w.type) !== 'bingo' || !key || seenRef.current.has(key)) return false;
          seenRef.current.add(key);
          return true;
        });
        if (pendingBingo.length > 0) enqueueWinners(pendingBingo);
      }

      // Tempo que os popups pendentes ainda precisam: o que resta do atual (se
      // houver) + cada grupo da fila (10s por página + 0,5s de intervalo).
      const busy = processingRef.current;
      const current = activeDurationRef.current;
      const remaining = visibleRef.current
        ? Math.max(0, Math.min(current, current - (Date.now() - shownAtRef.current)))
        : 0;
      const queued = queueRef.current.length;
      const hasPopups = busy || queued > 0;
      const popupsMs =
        remaining +
        (busy ? WINNER_POPUP_GAP_MS : 0) +
        queueRef.current.reduce((acc, g) => acc + groupDurationMs(g.length) + WINNER_POPUP_GAP_MS, 0) +
        // Pausa entre o último popup e o resumo.
        (hasPopups ? ROUND_SUMMARY_DELAY_MS - WINNER_POPUP_GAP_MS : 0);

      // A janela cresce na proporção dos popups, mantendo o resumo com no mínimo
      // ROUND_SUMMARY_MIN_MS; o LoopScreen segura a tela esse tempo extra.
      const windowMs = Math.max(FINISH_SCREEN_HOLD_MS, popupsMs + ROUND_SUMMARY_MIN_MS);
      const baseExtraMs = windowMs - FINISH_SCREEN_HOLD_MS;
      setFinishHoldExtraMs(baseExtraMs);
      const summaryDuration = windowMs - popupsMs;
      setSummaryMs(summaryDuration);
      const expectedOpenAt = Date.now() + popupsMs;

      // Abre o resumo só com a voz em silêncio (nada de locução por cima). Se a
      // espera atrasar a abertura, a janela do LoopScreen cresce o mesmo tanto
      // e o resumo mantém o tempo cheio.
      openSummaryRef.current = () => {
        cancelAudioWaitRef.current?.();
        cancelAudioWaitRef.current = whenAudioIdle(showSummary);
      };
      const showSummary = () => {
        cancelAudioWaitRef.current = null;
        const lateMs = Date.now() - expectedOpenAt;
        if (lateMs > 0) setFinishHoldExtraMs(baseExtraMs + lateMs);
        setVisible(false);
        activeGroupRef.current = null;
        setActiveGroup(null);
        setShowFullRoundWinners(true);
        finalTimerRef.current = setTimeout(() => {
          setShowFullRoundWinners(false);
          if (onClose) onClose();
        }, summaryDuration);
      };

      if (!hasPopups) {
        openSummaryRef.current();
      } else {
        // A fila segue sozinha (processQueue) e abre o resumo quando esvaziar.
        finishingRef.current = true;
        if (!busy) processQueue();
      }
    }
  }, [isDrawFinished, isLive, onClose, processQueue, enqueueWinners]);

  useEffect(() => {
    return () => {
      if (finalTimerRef.current) clearTimeout(finalTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
      cancelAudioWaitRef.current?.();
    };
  }, []);

  const handleClose = () => {
    if (finalTimerRef.current) clearTimeout(finalTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    setVisible(false);
    setShowFullRoundWinners(false);
    if (onClose) onClose();
  };

  if (!visible && !showFullRoundWinners) {
    return null;
  }

  // 1. Resumo "Ganhadores da Rodada" (fim do sorteio).
  if (showFullRoundWinners) {
    const toView = (list: WinnerEvent[], defaultPrizeStr: string) =>
      list.map((w, idx) => ({
        id: `${winnerKey(w) || w.playerName || 'w'}-${idx}`,
        name: getWinnerDisplayName(w, t),
        coupon: formatCouponDisplay(w),
        prize: getWinnerPrizeDisplay(w, list.length > 1, defaultPrizeStr, t),
        jackpot: w.jackpotWon === true,
      }));
    const categories: RoundCategoryView[] = [
      { key: 'line1', winners: toView(line1Winners, line1Prize) },
      { key: 'line2', winners: toView(line2Winners, line2Prize) },
      { key: 'bingo', winners: toView(bingoWinners, bingoPrize) },
    ];
    return (
      <RoundWinnersAzul
        key={`${drawNumber}-${dedupedWinners.map(winnerKey).join('|')}`}
        drawNumber={drawNumber}
        dateStr={dateStr}
        timeStr={timeStr}
        categories={categories}
        jackpotAmount={jackpotAmountGlobal}
        totalDurationMs={totalDurationMs}
        onClose={handleClose}
      />
    );
  }

  // 2. Popup durante o sorteio — um grupo (mesmo prêmio) por vez.
  const group = activeGroup ?? (dedupedWinners.length > 0 ? [dedupedWinners[dedupedWinners.length - 1]!] : []);
  if (group.length === 0) return null;
  const singleWinner = group[0]!;
  const normType = normalizeWinnerType(singleWinner.type) || 'bingo';
  const currentPrizeText = normType === 'line1' ? line1Prize : normType === 'line2' ? line2Prize : bingoPrize;

  return (
    <WinnerAzul
      key={`${drawNumber}-${normType}-${winnerKey(singleWinner)}`}
      isBingo={normType === 'bingo'}
      prizeType={normType}
      sealText={getPrizeDisplay(normType, t).full}
      winners={group.map((w, idx) => {
        const hasCard = Array.isArray(w.numbers) && w.numbers.length > 0;
        return {
          id: `${winnerKey(w) || w.playerName || 'w'}-${idx}`,
          name: getWinnerDisplayName(w, t),
          coupon: formatCouponDisplay(w),
          prize: getWinnerPrizeDisplay(w, group.length > 1, currentPrizeText, t),
          jackpot: w.jackpotWon === true,
          cardNumbers: hasCard ? w.numbers : undefined,
          paintedRows: hasCard
            ? Array.from(computeRowsToPaint(w.numbers!, drawnNumbers, w.drawnNumbersAtWin, w.type, w.winningLines)).sort((a, b) => a - b)
            : [],
        };
      })}
    />
  );
};

export const AzulWinnerPopup = React.memo(AzulWinnerPopupInner);

export default AzulWinnerPopup;
