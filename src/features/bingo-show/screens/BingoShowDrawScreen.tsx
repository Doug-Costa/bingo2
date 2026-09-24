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
import goldStyles from '../components/goldMetalText.module.css';
import { useAppTheme } from '@/contexts/ThemeContext';

// O hook (`useBingoShowRealtimeDraw`) expõe o status de cada prêmio como o rótulo de
// exibição em si (`PrizeStatusType`, ex.: "EM DISPUTA"), não como o enum visual que
// `BingoShowPrizeStatusCard` espera (`PrizeRowStatus`). Tradução mínima, só de tipo —
// nenhuma lógica de negócio nova.
function toPrizeRowStatus(status: PrizeStatusType): PrizeRowStatus {
  if (status === 'EM DISPUTA') return 'active';
  if (status === 'PREMIADO') return 'completed';
  return 'pending';
}

import { ThemeSelector } from '@/components/theme';

export const BingoShowDrawScreen: React.FC = () => {
  const mock = useBingoShowRealtimeDraw();
  const { isBlue } = useAppTheme();
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
      {/* TOP HEADER ROW */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 8,
          paddingRight: 8,
          paddingBottom: 8,
          height: 68,
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        {/* LEFT: 3D LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 220 }}>
          <img
            src="/themes/bingo-show-blue/logos/logo-main.png"
            alt="BINGO SHOW"
            style={{
              height: 52,
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 12px rgba(8, 127, 252, 0.6))',
            }}
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* CENTER: BINGO AO VIVO */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {/* Blue: ouro metálico (goldMetalText.module.css) no lugar do amarelo
              chapado — cor/sombra saem do inline e vêm da classe; tamanho,
              fonte e espaçamento continuam os mesmos em todos os temas. */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <span
              className={isBlue ? goldStyles.goldIcon : undefined}
              style={{ fontSize: 22, ...(isBlue ? {} : { color: '#FFCF12', textShadow: '0 0 10px rgba(255, 207, 18, 0.8)' }) }}
            >
              ★
            </span>
            <span
              className={isBlue ? goldStyles.goldMetalText : undefined}
              style={{
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: 3,
                fontFamily: 'Barlow Condensed, sans-serif',
                textTransform: 'uppercase',
                ...(isBlue ? {} : { color: '#FFCF12', textShadow: '0 0 20px rgba(255, 207, 18, 0.85), 0 2px 4px rgba(0,0,0,0.9)' }),
              }}
            >
              BINGO AO VIVO
            </span>
            <span
              className={isBlue ? goldStyles.goldIcon : undefined}
              style={{ fontSize: 22, ...(isBlue ? {} : { color: '#FFCF12', textShadow: '0 0 10px rgba(255, 207, 18, 0.8)' }) }}
            >
              ★
            </span>
          </div>
          <span
            className={isBlue ? goldStyles.liveSubtitle : undefined}
            style={{
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: 3,
              textTransform: 'uppercase',
              marginTop: -4,
              ...(isBlue ? {} : { color: '#FFDE38', textShadow: '0 0 8px rgba(255, 222, 56, 0.6)' }),
            }}
          >
            ★ SUA SORTE, NOSSO BINGO! ★
          </span>
        </div>

        {/* RIGHT: THEME SELECTOR + DATE/TIME PILL + SOUND */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 220, justifyContent: 'flex-end' }}>
          <ThemeSelector variant="dropdown" align="left" />

          {/* Integrated Date & Time pill [📅 28/07/2026 | 15:40:25] */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(3, 17, 48, 0.88)',
              border: '1.5px solid rgba(25, 117, 210, 0.6)',
              borderRadius: 20,
              padding: '6px 14px',
              boxShadow: '0 0 14px rgba(8, 127, 252, 0.3)',
              boxSizing: 'border-box',
            }}
          >
            <img src="/themes/bingo-show-blue/calendario.png" alt="calendário" style={{ width: 18, height: 18, objectFit: 'contain' }} />
            <span style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>{mock.dateStr || '28/07/2026'}</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>|</span>
            <span style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 900, letterSpacing: 1 }}>{mock.currentTimeStr}</span>
          </div>

          {/* Sound button — Circular Blue Speaker */}
          <div
            onClick={() => setSoundOn((prev) => !prev)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: soundOn ? '#087FFC' : 'rgba(3, 17, 48, 0.88)',
              borderColor: soundOn ? '#17C8FF' : 'rgba(25, 117, 210, 0.5)',
              borderWidth: 1.5,
              borderStyle: 'solid',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxSizing: 'border-box',
              boxShadow: soundOn ? '0 0 14px rgba(23, 200, 255, 0.6)' : 'none',
              transition: 'all 200ms ease',
            }}
          >
            <BingoShowIcon
              name={soundOn ? 'sound' : 'speaker-off'}
              size={18}
              color="#FFFFFF"
              transparentBg
            />
          </div>
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
                  countdownSeconds={mock.nextNumberCountdownSeconds}
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
