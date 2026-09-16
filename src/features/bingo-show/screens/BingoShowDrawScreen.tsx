/**
 * BingoShowDrawScreen.tsx — porte de
 * `tvapp1/src/features/bingo-show/screens/BingoShowDrawScreen.tsx` (Tela de Sorteio,
 * Bingo Show V2).
 *
 * Reescrito para bater card a card com o original RN: wrapper
 * `BingoShowAmbientBackground brightness="light"` (Ken Burns + glow respirando +
 * partículas + vinheta — estava ausente, causa raiz de "sem efeitos"), proporções de
 * flex idênticas (`topRow`60/`historyRow`40, `leftBox`38/`centerBox`62,
 * `couponsBox`55/`ticketsBox`45 SEMPRE renderizados — sem o `hasTickets` condicional
 * inventado), botão de som 30×30/ícone-16 (era 60×60/ícone-32), segundo `TimePill` usando
 * `mock.timeStr` (campo real do hook, não `currentTimeStr`), `DrawStage` sem
 * `countdownSeconds` (prop que não existe no original nem no hook), e
 * `BingoShowPrizeStatusCard` recebendo `line1Status`/`line2Status`/`bingoStatus`
 * DIRETO do hook (já são `'active'|'completed'|'pending'` — a tradução de string
 * `'EM DISPUTA'/'PREMIADO'` que existia aqui nunca batia com o valor real do hook e
 * fazia todo prêmio cair sempre em `'pending'`) mais `dateStr`/`timeStr` (props que
 * faltavam por completo).
 *
 * Áudio (`audioService`) permanece fora de escopo, conforme instrução original do
 * projeto ("não migrar áudio ainda") — o botão de som aqui só controla o próprio ícone/
 * estado visual, igual ao original antes da integração de áudio ser religada.
 */
'use client';

import React, { useState } from 'react';
import { BingoShowTvLayout } from '../layouts/BingoShowTvLayout';
import { BingoShowAmbientBackground } from '../components/BingoShowAmbientBackground';
import {
  BingoShowPrizeStatusCard,
  BingoShowCouponsTable,
  BingoShowTicketsGrid,
  BingoShowDrawnBalls,
  BingoShowTimePill,
  BingoShowIcon,
  BingoShowWinnerPopup,
} from '../components';
import { DrawStage } from '../components/DrawStage';
import { useBingoShowRealtimeDraw, type PrizeStatusType } from '../hooks/useBingoShowRealtimeDraw';
import { useBingoAudio } from '../hooks/useBingoAudio';
import { type PrizeRowStatus } from '../components/BingoShowPrizeStatusCard';
import { BingoShowColors, BingoShowSpacing } from '../design-system';

// O hook (`useBingoShowRealtimeDraw`) expõe o status de cada prêmio como o rótulo de
// exibição em si (`PrizeStatusType`, ex.: "EM DISPUTA"), não como o enum visual que
// `BingoShowPrizeStatusCard` espera (`PrizeRowStatus`). Tradução mínima, só de tipo —
// nenhuma lógica de negócio nova.
function toPrizeRowStatus(status: PrizeStatusType): PrizeRowStatus {
  if (status === 'EM DISPUTA') return 'active';
  if (status === 'PREMIADO') return 'completed';
  return 'pending';
}

export const BingoShowDrawScreen: React.FC = () => {
  const mock = useBingoShowRealtimeDraw();
  const [soundOn, setSoundOn] = useState(true);

  // Hook responsável pela locução (voz) do bingo (Bolas e Prêmios)
  useBingoAudio(soundOn, mock.currentBall, mock.winners);
  const last3Balls = React.useMemo(() => {
    if (!mock.drawnBalls || mock.drawnBalls.length === 0) return [];
    const withoutCurrent = mock.currentBall && mock.drawnBalls[mock.drawnBalls.length - 1] === mock.currentBall
      ? mock.drawnBalls.slice(0, -1)
      : mock.drawnBalls;
    return withoutCurrent.slice(-3).reverse();
  }, [mock.drawnBalls, mock.currentBall]);

  const hasTickets = mock.tickets.length > 0;

  const screenBody = (
    <div style={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* META ROW */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingLeft: BingoShowSpacing.xs,
          paddingRight: BingoShowSpacing.xs,
          paddingBottom: BingoShowSpacing.xs,
          gap: BingoShowSpacing.sm,
        }}
      >
        <BingoShowTimePill icon="calendar" text={mock.dateStr} glow={false} />
        <BingoShowTimePill icon="clock" text={mock.currentTimeStr} glow={false} />

        {/* Sound button — 30×30/ícone-16, igual ao original. */}
        <div
          onClick={() => setSoundOn((prev) => !prev)}
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: soundOn ? 'rgba(255, 222, 56, 0.16)' : 'rgba(255, 255, 255, 0.06)',
            borderColor: soundOn ? 'rgba(255, 222, 56, 0.5)' : BingoShowColors.borderSubtle,
            borderWidth: 1,
            borderStyle: 'solid',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          <BingoShowIcon
            name={soundOn ? 'sound' : 'speaker-off'}
            size={16}
            color={soundOn ? BingoShowColors.primary : BingoShowColors.textMuted}
          />
        </div>
      </div>

      {/* BODY ROW */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', width: '100%', minHeight: 0, gap: BingoShowSpacing.sm }}>
        {/* LEFT CENTER COLUMN */}
        <div style={{ flex: 68, minHeight: 0, display: 'flex', flexDirection: 'column', gap: BingoShowSpacing.sm }}>
          {/* TOP ROW */}
          <div style={{ flex: 60, display: 'flex', flexDirection: 'row', width: '100%', gap: BingoShowSpacing.sm }}>
            <div style={{ flex: 38, minHeight: 0 }}>
              <BingoShowPrizeStatusCard
                accumulatedAmount={mock.accumulatedPrize}
                triggerBallLimit={mock.triggerBallLimit}
                jackpotActive={mock.jackpotActive}
                line1Amount={mock.line1Prize}
                line2Amount={mock.line2Prize}
                bingoAmount={mock.bingoPrize}
                line1Status={toPrizeRowStatus(mock.line1Status)}
                line2Status={toPrizeRowStatus(mock.line2Status)}
                bingoStatus={toPrizeRowStatus(mock.bingoStatus)}
                drawNumber={mock.drawNumber}
                donationAmount={mock.donationAmount}
                dateStr={mock.dateStr}
                timeStr={mock.timeStr}
              />
            </div>
            <div style={{ flex: 62, minHeight: 0, display: 'flex' }}>
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DrawStage
                  title="NÚMERO SORTEADO"
                  currentNumber={mock.currentBall}
                  nextBalls={last3Balls}
                  sequenceNumber={mock.drawnBalls.length}
                />
              </div>
            </div>
          </div>

          {/* HISTORY ROW */}
          <div style={{ flex: 40, width: '100%', minHeight: 0 }}>
            <BingoShowDrawnBalls drawnBalls={mock.drawnBalls} totalBalls={mock.totalBalls} testJackpotPanelBackground />
          </div>
        </div>

        {/* RIGHT COLUMN — Cupons (Top Winners) + Cartelas. Sem cartelas do usuário, o
            card de Cupons se expande até o rodapé (pedido explícito do usuário). */}
        <div style={{ flex: 32, minHeight: 0, display: 'flex', flexDirection: 'column', gap: BingoShowSpacing.xs }}>
          <div style={{ flex: hasTickets ? 55 : 1, minHeight: 0 }}>
            <BingoShowCouponsTable coupons={mock.coupons} />
          </div>
          {hasTickets ? (
            <div style={{ flex: 45, minHeight: 0 }}>
              <BingoShowTicketsGrid tickets={mock.tickets} drawnBalls={mock.drawnBalls} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <BingoShowAmbientBackground brightness="light">
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: 6, boxSizing: 'border-box' }}>
        <BingoShowTvLayout
          mainFlex={1}
          fullBody={screenBody}
          overlay={
            <BingoShowWinnerPopup
              winners={mock.winners}
              isDrawFinished={mock.isDrawFinished}
              drawNumber={mock.drawNumber}
              dateStr={mock.dateStr}
              timeStr={mock.timeStr}
              line1Prize={mock.line1Prize}
              line2Prize={mock.line2Prize}
              bingoPrize={mock.bingoPrize}
              jackpotAmount={mock.accumulatedPrize}
              drawnNumbers={mock.drawnBalls}
              isLive={mock.isLive}
            />
          }
        />
      </div>
    </BingoShowAmbientBackground>
  );
};

export default BingoShowDrawScreen;
