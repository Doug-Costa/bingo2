/**
 * BingoShowWinnerPopup.tsx — Tela e Modal Gigante dos Ganhadores da Rodada.
 *
 * Arquitetura Adaptativa de Apresentação Final (TV 55"+):
 * 1. Hierarquia Assimétrica:
 *    - Área Esquerda (~42%): Sub-bloco 1 LINHA (topo) + Sub-bloco 2 LINHAS (base)
 *    - Área Direita (~58%): Bloco Principal BINGO HERO (destaque absoluto e cartela ampla)
 *
 * 2. SPLIT N (Quantidade Ilimitada de Vencedores):
 *    - 1 Vencedor: Card Hero Amplo
 *    - 2 Vencedores: 2 Cards Médios
 *    - 3 a 4 Vencedores: Grid 2x2 Compacto sem scroll
 *    - > 4 Vencedores: Rotação Automática por Páginas (4 cards por página)
 *
 * 3. Paginação e Temporizador Dinâmico:
 *    - Mínimo de 7,5s por página por categoria.
 *    - Duração: popup individual de 10s (timing.ts); no draw_finish o popup do bingo
 *      termina o tempo dele e o resumo ocupa o resto da janela de 30s do LoopScreen.
 *    - Paginação assíncrona por categoria garantindo exibição de 100% dos vencedores.
 *
 * 4. Integridade Financeira e de Dados:
 *    - Prêmios individuais e acumulados trazidos prontos do backend (sem soma no frontend).
 *    - Se jackpotWon === true, exibe o destaque do Jackpot separadamente do prêmio do Bingo.
 *    - Se a faixa estiver sem ganhador real, exibe estado neutro "SEM GANHADOR NESTA FAIXA" (sem mocks).
 *    - Grade 5x3 pintada estritamente com drawnNumbers.includes(num).
 */
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WinnerEvent } from '@/contexts/SSEContext';
import { BingoShowAssets } from '../assets';
import { BingoShowTopWinnersFrame } from './BingoShowTopWinnersFrame';
import { BingoShowBannerFrame } from './BingoShowBannerFrame';
import { BingoShowBadge } from './BingoShowBadge';
import { BingoShowIcon } from './BingoShowIcon';
import { BingoShowGlowHalo } from './BingoShowGlowHalo';
import { BingoShowColors } from '../design-system';
import { formatBrl } from '../utils/format';
import { useAppTheme } from '@/contexts/ThemeContext';
import { BingoShowWinnerPresentationBlue } from './BingoShowWinnerPresentationBlue';
import { FINISH_SCREEN_HOLD_MS, WINNER_POPUP_MS } from '../timing';
import { BingoShowRoundWinnersBlue, type RoundCategoryView } from './BingoShowRoundWinnersBlue';

export interface TopPlayerItem {
  playerName?: string;
  ticketId?: string;
}

export interface BingoShowWinnerPopupProps {
  winners: WinnerEvent[];
  topPlayers?: TopPlayerItem[];
  isDrawFinished?: boolean;
  drawNumber?: string;
  dateStr?: string;
  timeStr?: string;
  line1Prize?: string;
  line2Prize?: string;
  bingoPrize?: string;
  jackpotAmount?: string;
  drawnNumbers?: number[];
  visibleDurationMs?: number;
  onClose?: () => void;
  /** `false` enquanto o SSEContext ainda está reconciliando o cache restaurado do F5
   * contra o snapshot autoritativo (`recoveryPhase !== 'live'`). Winners que já vêm
   * nesse momento são restaurados do cache, não eventos novos — não podem reabrir o
   * popup individual. Default `true` pra não quebrar quem ainda não passa essa prop. */
  isLive?: boolean;
}

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

function getPrizeDisplay(type?: string) {
  const norm = normalizeWinnerType(type) || 'bingo';
  if (norm === 'line1') return { order: '1º PRÊMIO', title: '1 LINHA', full: '1º PRÊMIO • 1 LINHA' };
  if (norm === 'line2') return { order: '2º PRÊMIO', title: '2 LINHAS', full: '2º PRÊMIO • 2 LINHAS' };
  return { order: '3º PRÊMIO', title: 'BINGO', full: '3º PRÊMIO • BINGO' };
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

// Linhas da cartela a destacar, pela regra estrita do tipo do prêmio (line1: a linha
// vencedora real; line2: as duas; bingo/jackpot: todas). Extraída sem mudança de
// comportamento do PaintedCartelaGrid, para a apresentação Blue usar a MESMA regra.
export function computeRowsToPaint(
  customNumbers: number[][],
  drawnNumbers: number[] = [],
  drawnNumbersAtWin?: number[],
  type?: string,
  winningLines?: number[][],
): Set<number> {
  // Utiliza a fotografia das bolas sorteadas no momento exato da vitória, se disponível
  const effectiveDrawn = Array.isArray(drawnNumbersAtWin) && drawnNumbersAtWin.length > 0
    ? drawnNumbersAtWin
    : drawnNumbers;

  // Monta o Set visual incluindo o winningLines para considerar a linha vencedora como completamente desenhada
  const drawnForWinnerVisual = new Set<number>(effectiveDrawn);
  if (Array.isArray(winningLines)) {
    winningLines.forEach(line => line.forEach(num => drawnForWinnerVisual.add(num)));
  }

  // Mapeia quais linhas pintar com base na regra estrita do tipo do prêmio:
  const allowedRowsToPaint = new Set<number>();

  if (type === 'line1') {
    let matchIdx = -1;
    if (Array.isArray(winningLines) && winningLines.length > 0 && winningLines[0]) {
      const targetStr = winningLines[0].slice().sort().join(',');
      matchIdx = customNumbers.findIndex(r => r.slice().sort().join(',') === targetStr);
    }
    if (matchIdx >= 0) {
      allowedRowsToPaint.add(matchIdx);
    } else {
      // Fallback estrito: verifica a linha física realmente completa
      const firstComplete = customNumbers.findIndex(row => row.filter(n => n > 0).every(n => effectiveDrawn.includes(n)));
      if (firstComplete >= 0) allowedRowsToPaint.add(firstComplete);
    }
  } else if (type === 'line2') {
    const normalizeRow = (row: number[]) => row.filter(n => n > 0).slice().sort((a, b) => a - b).join(',');
    const tempRowsToPaint = new Set<number>();

    // 1. Tentar via winningLines primeiro
    if (Array.isArray(winningLines) && winningLines.length >= 2) {
      const targetStrs = winningLines.slice(0, 2).map(normalizeRow);
      customNumbers.forEach((row, rIdx) => {
        const rowStr = normalizeRow(row);
        if (targetStrs.includes(rowStr)) {
          tempRowsToPaint.add(rIdx);
        }
      });
      console.log('[CARTELA-LINE2-AUDIT]', { source: 'WINNING_LINES', winningLines, tempRowsToPaint });
    }

    // 2. Fallback 1: via drawnNumbersAtWin (estado isolado da vitória)
    if (tempRowsToPaint.size < 2 && Array.isArray(drawnNumbersAtWin) && drawnNumbersAtWin.length > 0) {
      console.log('[CARTELA-LINE2-AUDIT] winningLines incomplete or mismatch. Using DRAWN_AT_WIN.');
      tempRowsToPaint.clear();
      let count = 0;
      customNumbers.forEach((row, rIdx) => {
        const isComplete = row.filter(n => n > 0).every(n => drawnNumbersAtWin.includes(n));
        if (isComplete && count < 2) {
          tempRowsToPaint.add(rIdx);
          count++;
        }
      });
      console.log('[CARTELA-LINE2-AUDIT]', { source: 'DRAWN_AT_WIN', drawnNumbersAtWin, tempRowsToPaint });
    }

    // 3. Fallback 2: Defensivo final com as bolas atuais
    if (tempRowsToPaint.size < 2) {
      console.log('[CARTELA-LINE2-AUDIT] drawnNumbersAtWin insufficient. Using CURRENT_DRAWN_FALLBACK.');
      tempRowsToPaint.clear();
      let count = 0;
      customNumbers.forEach((row, rIdx) => {
        const isComplete = row.filter(n => n > 0).every(n => effectiveDrawn.includes(n));
        if (isComplete && count < 2) {
          tempRowsToPaint.add(rIdx);
          count++;
        }
      });
      console.log('[CARTELA-LINE2-AUDIT]', { source: 'CURRENT_DRAWN_FALLBACK', effectiveDrawn, tempRowsToPaint });
    }

    // Transfere o resultado seguro
    tempRowsToPaint.forEach(rIdx => allowedRowsToPaint.add(rIdx));

    if (allowedRowsToPaint.size < 2) {
      console.warn(`[CARTELA-PAINT] INCONSISTENCY: Expected 2 lines for line2, but found ${allowedRowsToPaint.size}.`);
    }
  } else {
    // bingo ou jackpot: pinta todas as linhas
    customNumbers.forEach((_, rIdx) => allowedRowsToPaint.add(rIdx));
  }

  return allowedRowsToPaint;
}

// Grade da Cartela Pintada Real: 5 COLUNAS X 3 LINHAS — PINTURA ESTRITA VIA drawnNumbersAtWin E REGRAS DA FAIXA
const PaintedCartelaGrid: React.FC<{
  themeColor: string;
  customNumbers: number[][];
  drawnNumbers?: number[];
  drawnNumbersAtWin?: number[];
  type?: string;
  winningLines?: number[][];
  compact?: boolean;
}> = ({
  themeColor,
  customNumbers,
  drawnNumbers = [],
  drawnNumbersAtWin,
  type,
  winningLines,
  compact = false,
}) => {
  if (!customNumbers || customNumbers.length === 0) {
    return null;
  }

  const allowedRowsToPaint = computeRowsToPaint(customNumbers, drawnNumbers, drawnNumbersAtWin, type, winningLines);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: compact ? 2 : 4,
        boxSizing: 'border-box',
      }}
    >
      {/* CABEÇALHO 5 COLUNAS B-I-N-G-O */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: compact ? 2 : 4, marginBottom: 4 }}>
        {['B', 'I', 'N', 'G', 'O'].map((letter) => (
          <div
            key={letter}
            style={{
              height: compact ? 26 : 38,
              borderRadius: 6,
              backgroundColor: 'rgba(0, 229, 255, 0.25)',
              border: `1.5px solid ${BingoShowColors.cyanNeon}`,
              color: '#FFFFFF',
              fontSize: compact ? 17 : 24,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textShadow: '0 0 8px #00E5FF',
              letterSpacing: 1,
            }}
          >
            {letter}
          </div>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gridTemplateRows: `repeat(${Math.max(customNumbers.length, 1)}, 1fr)`,
          gap: compact ? 2 : 4,
        }}
      >
        {customNumbers.flatMap((row, rIdx) =>
          row.map((num, cIdx) => {
            const isRowAllowed = allowedRowsToPaint.has(rIdx);
            const isDrawn = isRowAllowed && num > 0;
            return (
              <div
                key={`${rIdx}-${cIdx}`}
                style={{
                  borderRadius: compact ? 4 : 6,
                  backgroundColor: isDrawn ? themeColor : 'rgba(255, 255, 255, 0.12)',
                  border: isDrawn ? '2px solid #FFFFFF' : '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  fontSize: compact ? 16 : 22,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isDrawn ? `0 0 8px ${themeColor}aa` : 'none',
                  position: 'relative',
                }}
              >
                {num}
                {isDrawn && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 1,
                      right: 2,
                      fontSize: compact ? 7 : 9,
                      color: '#00FF88',
                      fontWeight: 900,
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
};

// Valor Monetário Exclusivo do Backend (sem usar o prêmio total da faixa em SPLIT se prizeAmount não existir)
function getWinnerPrizeDisplay(winner: WinnerEvent, isSplit: boolean, defaultPrizeStr: string): string {
  const hasValidPrize =
    winner.prizeAmount !== undefined && typeof winner.prizeAmount === 'number' && winner.prizeAmount > 0;
  return hasValidPrize ? formatBrl(winner.prizeAmount!) : isSplit ? 'VALOR NÃO INFORMADO' : defaultPrizeStr;
}

function getWinnerDisplayName(winner: WinnerEvent): string {
  return winner.playerName && winner.playerName.trim() !== '' ? winner.playerName : 'NOME NÃO INFORMADO';
}

// Componente do Card do Ganhador Adaptativo (Hero, Médio ou Compacto para Grid)
// Hierarquia de fontes do card do ganhador — 3 variantes conforme onde o card aparece
// (acabamento visual final): o popup individual de tela cheia pede as fontes maiores; o
// card HERO da coluna BINGO (1 vencedor, sem split) fica um degrau abaixo; os cards de
// grade (1ª/2ª linha, e qualquer card quando há SPLIT) ficam mais compactos por precisarem
// caber 2+ por página. Valores no meio de cada faixa pedida pelo usuário; `cartela` é o
// tamanho do título "CARTELA CONTEMPLADA" (não mexe na grade/pintura em si).
type CardSizeVariant = 'popup' | 'finalSolo' | 'finalSoloBingo' | 'finalSplit';
const CARD_SIZES: Record<
  CardSizeVariant,
  { label: number; cupom: number; nome: number; prizeLabel: number; prizeValue: number; cartela: number; gap: number }
> = {
  popup: { label: 25, cupom: 26, nome: 57, prizeLabel: 19, prizeValue: 80, cartela: 23, gap: 14 },
  // Tela final, 1 LINHA/2 LINHAS com 1 único ganhador
  finalSolo: { label: 19, cupom: 22, nome: 40, prizeLabel: 17, prizeValue: 58, cartela: 0, gap: 6 },
  // Tela final, BINGO com 1 único ganhador
  finalSoloBingo: { label: 20, cupom: 23, nome: 42, prizeLabel: 17, prizeValue: 62, cartela: 0, gap: 6 },
  // Tela final, categoria em SPLIT (2+ ganhadores)
  finalSplit: { label: 16, cupom: 18, nome: 30, prizeLabel: 15, prizeValue: 40, cartela: 0, gap: 8 },
};

const WinnerCard: React.FC<{
  winner: WinnerEvent;
  themeColor: string;
  defaultPrizeStr: string;
  isSplit: boolean;
  splitIndex: number;
  totalSplitCount: number;
  drawnNumbers: number[];
  jackpotAmountGlobal?: string;
  compact?: boolean;
  sizeVariant?: CardSizeVariant;
  /** Regra visual (não mexe nos dados): a TELA FINAL não mostra mais cartela em
   * nenhum caso (nem solo, nem SPLIT) — a cartela já apareceu no popup individual
   * quando o prêmio foi anunciado. Default `true` só pro popup individual, que
   * continua mostrando normalmente; a tela final passa `false` sempre. */
  allowCartela?: boolean;
  /** `'side'` (padrão, popup individual): texto à esquerda + cartela à direita, como
   * sempre foi. `'stacked'` (reservado — hoje sem uso real, já que a tela final não
   * mostra mais cartela nenhuma; mantido só pra não quebrar a composição caso
   * `allowCartela` volte a `true` em algum card). */
  cartelaLayout?: 'side' | 'stacked';
  /** `'fill'` (padrão, popup individual): moldura ocupa 100%×100% da célula, como
   * sempre foi. `'compact'` (tela final): moldura vira um card pequeno e centralizado
   * (~88% de largura, altura pelo conteúdo) sobre o card colorido da categoria —
   * antes a moldura escura ocupava a coluna quase inteira e escondia o fundo
   * amarelo/ciano/verde por trás; pedido explícito do usuário pra "ver o fundo
   * colorido ao redor". */
  frameFit?: 'fill' | 'compact';
}> = ({
  winner,
  themeColor,
  defaultPrizeStr,
  isSplit,
  splitIndex,
  totalSplitCount,
  drawnNumbers,
  jackpotAmountGlobal,
  compact = false,
  sizeVariant = 'finalSolo',
  allowCartela = true,
  cartelaLayout = 'side',
  frameFit = 'fill',
}) => {
  const sz = CARD_SIZES[sizeVariant];
  const formattedTicket = formatCouponDisplay(winner);
  const hasRealNumbers = Array.isArray(winner.numbers) && winner.numbers.length > 0;
  const showCartela = hasRealNumbers && allowCartela;
  const isStacked = showCartela && cartelaLayout === 'stacked';
  const isCompactFrame = frameFit === 'compact';
  const isJackpot = winner.jackpotWon === true;

  const prizeDisplayValue = getWinnerPrizeDisplay(winner, isSplit, defaultPrizeStr);

  const displayName = getWinnerDisplayName(winner);

  return (
    <BingoShowTopWinnersFrame
      padding="sm"
      style={
        isCompactFrame
          ? {
              width: '86%',
              maxWidth: !isSplit ? 480 : undefined,
              height: 'auto',
              minHeight: !isSplit ? 180 : 0,
              minWidth: 0,
              borderRadius: 18,
              boxShadow: `0 6px 18px rgba(0,0,0,0.55), 0 0 12px ${themeColor}22`,
              border: isJackpot ? '2px solid #FFD700' : undefined,
            }
          : {
              width: '100%',
              height: '100%',
              minHeight: 0,
              minWidth: 0,
              borderRadius: 16,
              boxShadow: `0 8px 24px rgba(0,0,0,0.8), 0 0 16px ${themeColor}33`,
              border: isJackpot ? '2px solid #FFD700' : undefined,
            }
      }
      contentStyle={
        isStacked
          ? {
              display: 'grid',
              gridTemplateRows: 'auto minmax(0, 1fr)',
              gap: compact ? 8 : 12,
              padding: compact ? '8px 12px' : '14px 18px',
              height: '100%',
              minHeight: 0,
              minWidth: 0,
            }
          : {
              display: 'grid',
              gridTemplateColumns: showCartela ? 'minmax(0, 1fr) minmax(260px, 36%)' : 'minmax(0, 1fr)',
              gap: compact ? 8 : 16,
              alignItems: 'center',
              padding: isCompactFrame ? (compact ? '16px 20px' : '24px') : compact ? '8px 12px' : '14px 18px',
              height: isCompactFrame ? 'auto' : '100%',
              minHeight: 0,
              minWidth: 0,
            }
      }
    >
      {/* BLOCO DE INFO: rótulo → nome → cupom logo abaixo do nome → prêmio, tudo numa
          coluna coesa centralizada, sem espaço morto artificial entre as partes. Em
          `stacked` some texto fica na linha `auto` de cima (altura só o que precisa),
          deixando o resto pra cartela embaixo. */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: sz.gap, height: isStacked || isCompactFrame ? 'auto' : '100%', minWidth: 0 }}>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BingoShowIcon name="winner" size={sz.label} color={isJackpot ? '#FFD700' : themeColor} transparentBg />
            <span
              style={{
                fontSize: sz.label,
                fontWeight: 900,
                color: isJackpot ? '#FFD700' : themeColor,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              {isSplit ? `GANHADOR ${splitIndex + 1}/${totalSplitCount}` : 'GANHADOR CONTEMPLADO'}
            </span>
          </div>

          {/* NOME DO JOGADOR */}
          <span
            style={{
              fontSize: sz.nome,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.05,
              whiteSpace: 'normal',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              width: '100%',
            }}
          >
            {displayName}
          </span>

          {/* CUPOM — logo abaixo do nome, não mais num canto separado */}
          {formattedTicket && (
            <span
              style={{
                fontSize: sz.cupom,
                fontWeight: 900,
                color: themeColor,
                letterSpacing: 1,
              }}
            >
              CUPOM {formattedTicket}
            </span>
          )}
        </div>

        {/* VALOR INDIVIDUAL DO GANHADOR */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontSize: sz.prizeLabel, fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', letterSpacing: 1, textTransform: 'uppercase', display: 'block' }}>
            {isSplit ? 'PRÊMIO INDIVIDUAL' : 'PRÊMIO DO GANHADOR'}
          </span>
          <span
            style={{
              fontSize: sz.prizeValue,
              fontWeight: 900,
              color: '#FFDE38',
              textShadow: '0 0 18px #FF9100',
              whiteSpace: 'nowrap',
              letterSpacing: 1,
              lineHeight: 1.1,
            }}
          >
            {prizeDisplayValue}
          </span>

          {/* CELEBRAÇÃO DE JACKPOT GANHO (VALOR SEMENTICAMENTE SEPARADO) */}
          {isJackpot && (
            <div
              style={{
                backgroundColor: 'rgba(255, 215, 0, 0.18)',
                border: '1.5px solid #FFD700',
                borderRadius: 10,
                padding: compact ? '4px 8px' : '8px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: compact ? 10 : 14, fontWeight: 900, color: '#FFD700', letterSpacing: 1 }}>
                💎 JACKPOT CONQUISTADO!
              </span>
              {jackpotAmountGlobal && (
                <span style={{ fontSize: compact ? 12 : 18, fontWeight: 900, color: '#FFFFFF', textShadow: '0 0 10px #FFD700' }}>
                  {jackpotAmountGlobal}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CARTELA PINTADA REAL — só quando o backend manda `winner.numbers` E a regra
          visual permite (`allowCartela`: falso em SPLIT na tela final). Em `stacked`
          fica centralizada embaixo com proporção fixa (1.45/1, nunca 100% da altura
          disponível) pra nunca esticar verticalmente — bug reportado na coluna do
          BINGO, que antes herdava a altura inteira da categoria. */}
      {showCartela ? (
        isStacked ? (
          <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxHeight: '100%',
                aspectRatio: '1.45 / 1',
                backgroundColor: 'rgba(6, 12, 40, 0.85)',
                border: `2px solid ${isJackpot ? '#FFD700' : themeColor}`,
                borderRadius: 14,
                padding: 6,
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexShrink: 0 }}>
                <BingoShowIcon name="star" size={sz.cartela - 4} color="#FFDE38" transparentBg />
                <span style={{ fontSize: sz.cartela, fontWeight: 900, color: '#FFDE38', letterSpacing: 1, textTransform: 'uppercase' }}>
                  CARTELA CONTEMPLADA
                </span>
                <BingoShowIcon name="star" size={sz.cartela - 4} color="#FFDE38" transparentBg />
              </div>
              <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                <PaintedCartelaGrid
                  themeColor={themeColor}
                  customNumbers={winner.numbers!}
                  drawnNumbers={drawnNumbers}
                  drawnNumbersAtWin={winner.drawnNumbersAtWin}
                  type={winner.type}
                  winningLines={winner.winningLines}
                  compact={compact}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              height: '100%',
              minHeight: 0,
              backgroundColor: 'rgba(6, 12, 40, 0.85)',
              border: `2px solid ${isJackpot ? '#FFD700' : themeColor}`,
              borderRadius: 14,
              padding: 6,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <BingoShowIcon name="star" size={sz.cartela - 4} color="#FFDE38" transparentBg />
              <span style={{ fontSize: sz.cartela, fontWeight: 900, color: '#FFDE38', letterSpacing: 1, textTransform: 'uppercase' }}>
                CARTELA CONTEMPLADA
              </span>
              <BingoShowIcon name="star" size={sz.cartela - 4} color="#FFDE38" transparentBg />
            </div>
            <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
              <PaintedCartelaGrid
                themeColor={themeColor}
                customNumbers={winner.numbers!}
                drawnNumbers={drawnNumbers}
                drawnNumbersAtWin={winner.drawnNumbersAtWin}
                type={winner.type}
                winningLines={winner.winningLines}
                compact={compact}
              />
            </div>
          </div>
        )
      ) : null}
    </BingoShowTopWinnersFrame>
  );
};

// Altura FIXA do cabeçalho de categoria na tela final — reduzida para focar apenas na cápsula
const HEADER_HEIGHT = 80;

// Sub-Bloco de Categoria Adaptativo (Linha 1, Linha 2 ou Bingo Hero com Paginação Autônoma)
const CategoryWinnerBlock: React.FC<{
  title: string;
  categoryKey: 'line1' | 'line2' | 'bingo';
  winnerList: WinnerEvent[];
  themeColor: string;
  defaultPrizeStr: string;
  assetBg: string;
  drawnNumbers: number[];
  jackpotAmountGlobal?: string;
  totalDurationMs: number;
}> = ({
  title,
  categoryKey,
  winnerList,
  themeColor,
  defaultPrizeStr,
  assetBg,
  drawnNumbers,
  jackpotAmountGlobal,
  totalDurationMs,
}) => {
  // Paginação uniforme: 2 ganhadores por página em qualquer categoria (1ª linha, 2ª
  // linha ou BINGO) — as 3 colunas agora têm o mesmo espaço, então não faz mais
  // sentido o BINGO paginar diferente (era 4/página quando tinha 58% da largura).
  const itemsPerPage = 2;
  const totalWinners = winnerList.length;
  const totalPages = Math.ceil(totalWinners / itemsPerPage) || 1;
  const [currentPage, setCurrentPage] = useState(0);

  // Rotação Assíncrona e Autônoma por Categoria
  useEffect(() => {
    if (totalPages <= 1) {
      setCurrentPage(0);
      return;
    }
    const pageInterval = totalDurationMs / totalPages;
    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, pageInterval);
    return () => clearInterval(timer);
  }, [totalPages, totalDurationMs]);

  const isSplit = totalWinners > 1;
  const hasWinners = totalWinners > 0;
  const hasJackpotInCategory = winnerList.some((w) => w.jackpotWon === true);

  // Log de auditoria para SPLIT
  useEffect(() => {
    if (isSplit) {
      console.log(`[SPLIT-AUDIT] ========================================`);
      console.log(`[SPLIT-AUDIT] Category="${title}" (${categoryKey}) | winnerList.length=${totalWinners}`);
      winnerList.forEach((w, idx) => {
        const rawTicket = w.ticketId || 'UNDEFINED';
        const cleanTicket = cleanTicketId(w.ticketId);
        const key = winnerKey(w);
        console.log(
          `[SPLIT-AUDIT]   [${idx + 1}/${totalWinners}] RAW_TICKET="${rawTicket}" | CLEAN="${cleanTicket}" | NAME="${w.playerName || 'N/A'}" | TYPE="${w.type}" | KEY="${key}"`,
        );
      });
      console.log(`[SPLIT-AUDIT] ========================================`);
    }
  }, [isSplit, title, categoryKey, totalWinners, winnerList]);

  // Fatia de ganhadores da página atual (máximo 4 por página)
  const currentPageWinners = useMemo(() => {
    if (!hasWinners) return [];
    const start = currentPage * itemsPerPage;
    return winnerList.slice(start, start + itemsPerPage);
  }, [winnerList, currentPage, itemsPerPage, hasWinners]);

  return (
    <BingoShowGlowHalo color={hasJackpotInCategory ? '#FFD700' : themeColor} bleed={12} intensity={0.6} style={{ height: '100%', width: '100%' }}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: 0,
          minWidth: 0,
          backgroundImage: `url(${assetBg})`,
          backgroundSize: '100% 100%',
          borderRadius: 20,
          boxSizing: 'border-box',
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr)',
          overflow: 'hidden',
        }}
      >
        {/* CABEÇALHO DA FAIXA — DENTRO da própria moldura colorida (mesmo elemento do
            fundo), com altura FIXA (`HEADER_HEIGHT`) igual nas 3 colunas — o BINGO tem
            fonte maior mas isso nunca muda a altura do cabeçalho nem empurra o card pra
            baixo. Título alinhado por `alignItems:'flex-end'` dentro da linha flexível: a
            BASE do texto sempre fica na mesma altura entre categorias, só a fonte cresce
            pra cima. Padding assimétrico (12/18/8/18) — antes era 12 uniforme, o texto
            ficava colado na borda esquerda/topo, parecendo "encavalar" a moldura em vez de
            estar dentro de uma área de cabeçalho desenhada. */}
        <div
          style={{
            width: '100%',
            height: HEADER_HEIGHT,
            minHeight: HEADER_HEIGHT,
            maxHeight: HEADER_HEIGHT,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 18px 0px 18px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              border: `1px solid ${themeColor}`,
              borderRadius: 24,
              padding: '6px 24px',
              boxShadow: `0 4px 12px rgba(0,0,0,0.5), inset 0 0 8px ${themeColor}33`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: categoryKey === 'bingo' ? 56 : 46,
                fontWeight: 900,
                color: themeColor,
                textAlign: 'center',
                textTransform: 'uppercase',
                lineHeight: 1,
                textShadow: categoryKey === 'bingo' ? `0 0 16px ${themeColor}aa` : undefined,
              }}
            >
              {hasJackpotInCategory ? `💎 ${getPrizeDisplay(categoryKey).title} + JACKPOT` : getPrizeDisplay(categoryKey).title}
            </span>
          </div>
          {isSplit && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <span style={{ backgroundColor: themeColor, color: '#000', padding: '2px 8px', borderRadius: 8, fontWeight: 900, fontSize: 11 }}>
                ⚡ SPLIT • {totalWinners}
              </span>
              {totalPages > 1 && (
                <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 8px', borderRadius: 8, fontWeight: 900, fontSize: 10 }}>
                  {currentPage + 1}/{totalPages}
                </span>
              )}
            </div>
          )}
        </div>

        {/* CORPO DE CARDS OU ESTADO VAZIO — `minmax(0,1fr)` (não `flex:1` solto): o
            conteúdo não pode determinar a altura do bloco, e o card de baixo (em splits
            empilhados) não pode empurrar a categoria seguinte nem vazar do container.
            Padding próprio (a moldura externa não tem mais padding uniforme — cada área
            cuida do próprio respiro agora). */}
        <div style={{ width: '100%', minHeight: 0, boxSizing: 'border-box', padding: '6px 14px 14px 14px', display: 'grid', gridTemplateRows: 'minmax(0, 1fr)' }}>
          {!hasWinners ? (
            /* ESTADO VAZIO SEM GANHADOR REAL NESTA FAIXA (SEM MOCKS) */
            <div
              style={{
                width: '100%',
                height: '100%',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 14,
                border: '1px dashed rgba(255, 255, 255, 0.2)',
                padding: 16,
              }}
            >
              <BingoShowIcon name="star" size={32} color="rgba(255, 255, 255, 0.3)" transparentBg />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: 'rgba(255, 255, 255, 0.5)',
                  letterSpacing: 1.5,
                  marginTop: 8,
                  textTransform: 'uppercase',
                }}
              >
                NENHUM GANHADOR NESTA FAIXA
              </span>
            </div>
          ) : (
            /* GRADE DE WINNER CARDS — 1 ou 2 empilhados verticalmente por página. Tela
               final NUNCA mostra cartela (já apareceu no popup individual quando o
               prêmio foi anunciado) — `allowCartela={false}` sempre. Cada célula centraliza
               o card compacto (`frameFit="compact"`) dentro do card colorido da categoria,
               deixando o fundo amarelo/ciano/verde visível ao redor. Gap de 14px entre cards
               SPLIT empilhados (era 8) — pedido explícito: "nenhum card pode encostar no
               outro", mínimo de 12-16px. */
            <div
              style={{
                display: 'grid',
                width: '100%',
                height: '100%',
                gridTemplateColumns: '1fr',
                gridTemplateRows: currentPageWinners.length > 1 ? 'repeat(2, 1fr)' : '1fr',
                gap: 14,
                minHeight: 0,
              }}
            >
              {currentPageWinners.map((w, pageIdx) => {
                const globalIndex = currentPage * itemsPerPage + pageIdx;
                return (
                  <div
                    key={`${w.ticketId || w.playerName}-${globalIndex}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      // Mantemos alinhado centralmente ou levemente acima com flex,
                      // a nova cápsula e as proporções da caixa resolvem o vazio.
                      transform: !isSplit ? 'translateY(-8px)' : undefined,
                    }}
                  >
                    <WinnerCard
                      winner={w}
                      themeColor={themeColor}
                      defaultPrizeStr={defaultPrizeStr}
                      isSplit={isSplit}
                      splitIndex={globalIndex}
                      totalSplitCount={totalWinners}
                      drawnNumbers={drawnNumbers}
                      jackpotAmountGlobal={jackpotAmountGlobal}
                      compact={isSplit}
                      allowCartela={false}
                      frameFit="compact"
                      sizeVariant={isSplit ? 'finalSplit' : categoryKey === 'bingo' ? 'finalSoloBingo' : 'finalSolo'}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </BingoShowGlowHalo>
  );
};

export const BingoShowWinnerPopup: React.FC<BingoShowWinnerPopupProps> = ({
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
  isLive = true,
}) => {
  const { isBlue } = useAppTheme();
  const [activeSingleWinner, setActiveSingleWinner] = useState<WinnerEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showFullRoundWinners, setShowFullRoundWinners] = useState(false);

  const seenRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<WinnerEvent[]>([]);
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

  const hasFinishedForCurrentDrawRef = useRef(false);
  const finalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset por drawNumber para garantir estado limpo na próxima rodada
  useEffect(() => {
    if (finalTimerRef.current) clearTimeout(finalTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    seenRef.current.clear();
    queueRef.current = [];
    processingRef.current = false;
    hasFinishedForCurrentDrawRef.current = false;
    setActiveSingleWinner(null);
    setVisible(false);
    setShowFullRoundWinners(false);
  }, [drawNumber]);

  const processQueue = useCallback(() => {
    if (processingRef.current || queueRef.current.length === 0) return;
    processingRef.current = true;
    const nextWinner = queueRef.current.shift()!;
    setActiveSingleWinner(nextWinner);
    setVisible(true);
    shownAtRef.current = Date.now();

    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      nextTimerRef.current = setTimeout(() => {
        processingRef.current = false;
        processQueue();
      }, 500);
    }, WINNER_POPUP_MS);
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
      queueRef.current.push(...newEvents);
      processQueue();
    }
  }, [winners, isDrawFinished, isLive, processQueue, drawNumber]);

  // Exibição da Tela Final de Encerramento (Gatilho determinístico protegido via finalTimerRef)
  useEffect(() => {
    if (isDrawFinished && !hasFinishedForCurrentDrawRef.current) {
      hasFinishedForCurrentDrawRef.current = true;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
      if (finalTimerRef.current) clearTimeout(finalTimerRef.current);
      processingRef.current = false;
      queueRef.current = [];

      // Popup no ar (normalmente o do BINGO): deixa terminar o tempo dele antes do
      // resumo, em vez de cortá-lo. O resumo fica o restante da janela do LoopScreen.
      const remaining = visibleRef.current
        ? Math.max(0, Math.min(WINNER_POPUP_MS, WINNER_POPUP_MS - (Date.now() - shownAtRef.current)))
        : 0;
      const summaryDuration = FINISH_SCREEN_HOLD_MS - remaining;
      setSummaryMs(summaryDuration);

      const openSummary = () => {
        setVisible(false);
        setActiveSingleWinner(null);
        setShowFullRoundWinners(true);
        finalTimerRef.current = setTimeout(() => {
          setShowFullRoundWinners(false);
          if (onClose) onClose();
        }, summaryDuration);
      };
      if (remaining > 0) {
        hideTimerRef.current = setTimeout(openSummary, remaining);
      } else {
        openSummary();
      }
    }
  }, [isDrawFinished, onClose]);

  useEffect(() => {
    return () => {
      if (finalTimerRef.current) clearTimeout(finalTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
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

  // 1. EXIBIÇÃO NO FINISH DRAW (LAYOUT ASSIMÉTRICO ADAPTATIVO 42% / 58%)
  if (showFullRoundWinners) {
    // Tema Blue: mesmos ganhadores deduplicados, mesmo split (2+ ganhadores), mesmos
    // valores individuais do backend e mesmo tempo total — só a apresentação muda.
    // A key é a rodada + os ganhadores: só um novo resultado reinicia a sequência.
    if (isBlue) {
      const toView = (list: WinnerEvent[], defaultPrizeStr: string) =>
        list.map((w, idx) => ({
          id: `${winnerKey(w) || w.playerName || 'w'}-${idx}`,
          name: getWinnerDisplayName(w),
          coupon: formatCouponDisplay(w),
          prize: getWinnerPrizeDisplay(w, list.length > 1, defaultPrizeStr),
          jackpot: w.jackpotWon === true,
        }));
      const categories: RoundCategoryView[] = [
        { key: 'line1', winners: toView(line1Winners, line1Prize) },
        { key: 'line2', winners: toView(line2Winners, line2Prize) },
        { key: 'bingo', winners: toView(bingoWinners, bingoPrize) },
      ];
      return (
        <BingoShowRoundWinnersBlue
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

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(0, 4, 20, 0.95)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          boxSizing: 'border-box',
        }}
      >
        {/* EXPLOSÃO DE CONFETES E BRILHO */}
        <img
          src={BingoShowAssets.particles.confetti}
          alt="Confetes"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85, pointerEvents: 'none', zIndex: 1 }}
        />
        <img
          src={BingoShowAssets.particles.gold}
          alt="Brilho Ouro"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65, pointerEvents: 'none', animation: 'bs-pulse 2s ease-in-out infinite', zIndex: 1 }}
        />

        {/* CONTAINER MÁXIMO DA TV (98VW / 95VH / 1800PX) */}
        <div
          style={{
            position: 'relative',
            width: '90%',
            height: '90%',
            display: 'grid',
            gridTemplateRows: 'auto minmax(0, 1fr) auto',
            minHeight: 0,
            gap: 12,
            zIndex: 2,
          }}
        >
          {/* HEADER TOP WINNERS FRAME */}
          <BingoShowGlowHalo color={BingoShowColors.cyanNeon} bleed={16} intensity={0.65}>
            <BingoShowTopWinnersFrame
              padding="sm"
              style={{ width: '100%', height: 86 }}
              contentStyle={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: 24,
                paddingRight: 24,
              }}
            >
              <img src={BingoShowAssets.logos.badge} alt="Bingo Show Logo" style={{ height: 64, aspectRatio: '616 / 349', objectFit: 'contain' }} />

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: '#FFDE38',
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    textShadow: '0 0 16px #FF9100, 0 2px 4px rgba(0,0,0,0.8)',
                  }}
                >
                  🏆 GANHADORES DA RODADA DO BINGO SHOW 🏆
                </span>
                <span style={{ fontSize: 15, fontWeight: 800, color: BingoShowColors.cyanNeon, letterSpacing: 2, marginTop: 2 }}>
                  SORTEIO {drawNumber} • {dateStr} às {timeStr}
                </span>
              </div>

              <button
                onClick={handleClose}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  border: `2px solid ${BingoShowColors.primary}`,
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  color: '#FFFFFF',
                  fontSize: 20,
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                ✕
              </button>
            </BingoShowTopWinnersFrame>
          </BingoShowGlowHalo>

          {/* CORPO EM 3 COLUNAS IGUAIS (1 LINHA | 2 LINHAS | BINGO) — layout novo,
              substitui o antigo assimétrico 42%/58%. As 3 categorias ocupam
              aproximadamente o mesmo espaço; cada coluna é independente
              (`gridTemplateRows: auto minmax(0,1fr)` dentro do próprio bloco), então uma
              categoria nunca empurra a vizinha. Gap 20px — o `BingoShowGlowHalo` de cada
              bloco vaza ~10-12px de brilho pra fora da própria caixa; gap menor que isso
              misturava os brilhos na fronteira entre colunas. */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 20,
              minHeight: 0,
              minWidth: 0,
              overflow: 'hidden',
              width: '100%',
            }}
          >
            <div style={{ minHeight: 0, height: '100%', minWidth: 0, overflow: 'hidden' }}>
              <CategoryWinnerBlock
                title={getPrizeDisplay('line1').title}
                categoryKey="line1"
                winnerList={line1Winners}
                themeColor={BingoShowColors.primary}
                defaultPrizeStr={line1Prize}
                assetBg={BingoShowAssets.cards.prizeLineGold}
                drawnNumbers={drawnNumbers}
                jackpotAmountGlobal={jackpotAmountGlobal}
                totalDurationMs={totalDurationMs}
              />
            </div>

            <div style={{ minHeight: 0, height: '100%', minWidth: 0, overflow: 'hidden' }}>
              <CategoryWinnerBlock
                title={getPrizeDisplay('line2').title}
                categoryKey="line2"
                winnerList={line2Winners}
                themeColor={BingoShowColors.cyanNeon}
                defaultPrizeStr={line2Prize}
                assetBg={BingoShowAssets.cards.prizeLineCyan}
                drawnNumbers={drawnNumbers}
                jackpotAmountGlobal={jackpotAmountGlobal}
                totalDurationMs={totalDurationMs}
              />
            </div>

            <div style={{ minHeight: 0, height: '100%', minWidth: 0, overflow: 'hidden' }}>
              <CategoryWinnerBlock
                title={getPrizeDisplay('bingo').title}
                categoryKey="bingo"
                winnerList={bingoWinners}
                themeColor={BingoShowColors.greenSuccess}
                defaultPrizeStr={bingoPrize}
                assetBg={BingoShowAssets.cards.prizeBingoGreen}
                drawnNumbers={drawnNumbers}
                jackpotAmountGlobal={jackpotAmountGlobal}
                totalDurationMs={totalDurationMs}
              />
            </div>
          </div>

          {/* FOOTER BANNER FRAME */}
          <BingoShowBannerFrame
            padding="sm"
            style={{ width: '100%', height: 46, zIndex: 2 }}
            contentStyle={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255, 255, 255, 0.7)', letterSpacing: 2, textTransform: 'uppercase' }}>
              BINGO SHOW • RESULTADOS DA RODADA
            </span>
          </BingoShowBannerFrame>
        </div>
      </div>
    );
  }

  // 2. EXIBIÇÃO POPUP INDIVIDUAL DURANTE O SORTEIO
  const singleWinner = activeSingleWinner || (dedupedWinners.length > 0 ? dedupedWinners[dedupedWinners.length - 1]! : null);
  if (!singleWinner) return null;

  const normType = normalizeWinnerType(singleWinner.type) || 'bingo';
  const themeColor = normType === 'line1' ? BingoShowColors.primary : normType === 'line2' ? BingoShowColors.cyanNeon : BingoShowColors.greenSuccess;
  const currentPrizeText = normType === 'line1' ? line1Prize : normType === 'line2' ? line2Prize : bingoPrize;

  // Tema Blue: mesma vitória, mesmos dados e mesma regra de linha vencedora — só a
  // apresentação muda. A key é a própria vitória (sorteio + ganhador), então só um
  // NOVO ganhador reinicia a sequência de animação; re-renders do relógio/SSE não.
  if (isBlue) {
    const hasCard = Array.isArray(singleWinner.numbers) && singleWinner.numbers.length > 0;
    const paintedRows = hasCard
      ? Array.from(
          computeRowsToPaint(
            singleWinner.numbers!,
            drawnNumbers,
            singleWinner.drawnNumbersAtWin,
            singleWinner.type,
            singleWinner.winningLines,
          ),
        ).sort((a, b) => a - b)
      : [];
    return (
      <BingoShowWinnerPresentationBlue
        key={`${drawNumber}-${winnerKey(singleWinner)}`}
        kind={normType === 'bingo' && singleWinner.jackpotWon === true ? 'jackpot' : normType}
        sealText={getPrizeDisplay(normType).full}
        displayName={getWinnerDisplayName(singleWinner)}
        couponText={formatCouponDisplay(singleWinner)}
        prizeLabel="PRÊMIO DO GANHADOR"
        prizeValue={getWinnerPrizeDisplay(singleWinner, false, currentPrizeText)}
        jackpotAmount={jackpotAmountGlobal}
        cardNumbers={hasCard ? singleWinner.numbers : undefined}
        paintedRows={paintedRows}
      />
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 4, 20, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <img src={BingoShowAssets.particles.confetti} alt="Confetes" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, pointerEvents: 'none' }} />

      <BingoShowGlowHalo color={themeColor} bleed={28} intensity={0.75} style={{ zIndex: 2, width: '88%', height: '72%' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(4, 8, 38, 0.95)',
            border: `3px solid ${themeColor}`,
            borderRadius: 28,
            padding: 20,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 12 }}>
            {normType === 'bingo' ? (
              // BINGO tem mais destaque que os outros prêmios — "3º PRÊMIO" pequeno em cima,
              // "BINGO" bem maior embaixo, em vez do badge de linha única dos outros tipos.
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: themeColor, letterSpacing: 3, textTransform: 'uppercase' }}>
                  {getPrizeDisplay(normType).order}
                </span>
                <span style={{ fontSize: 80, fontWeight: 900, color: themeColor, letterSpacing: 2, textTransform: 'uppercase', textShadow: `0 0 22px ${themeColor}aa` }}>
                  {getPrizeDisplay(normType).title}
                </span>
              </div>
            ) : (
              <BingoShowBadge label={getPrizeDisplay(normType).full} variant={normType === 'line1' ? 'gold' : 'cyan'} style={{ padding: '14px 38px', fontSize: 28 }} />
            )}
          </div>

          <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
            <WinnerCard
              winner={singleWinner}
              themeColor={themeColor}
              defaultPrizeStr={currentPrizeText}
              isSplit={false}
              splitIndex={0}
              totalSplitCount={1}
              drawnNumbers={drawnNumbers}
              jackpotAmountGlobal={jackpotAmountGlobal}
              compact={false}
              sizeVariant="popup"
            />
          </div>
        </div>
      </BingoShowGlowHalo>
    </div>
  );
};

export default BingoShowWinnerPopup;
