/**
 * BingoShowLoopScreen.tsx — Gerenciador do ciclo de telas da TV (Sorteio <-> Lobby).
 *
 * Exibe a tela de sorteio em tempo real (`BingoShowDrawScreen`). Quando o sorteio é
 * concluído (`draw_finish` / `draw_end`), MANTÉM a exibição da tela de sorteio com o
 * popup do bingo (se no ar) e depois o resumo "Ganhadores da Rodada" — janela de
 * FINISH_SCREEN_HOLD_MS (timing.ts) — antes de retornar ao Lobby.
 */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useGameSocket } from '@/contexts/SSEContext';
import { BingoShowLobbyScreen } from './BingoShowLobbyScreen';
import { BingoShowDrawScreen } from './BingoShowDrawScreen';
import { FINISH_SCREEN_HOLD_MS } from '../timing';
import { useFinishHoldExtraMs } from '../finishHold';
import { BingoShowPromoModal } from '../components/BingoShowPromoModal';

export const BingoShowLoopScreen: React.FC = () => {
  const { drawActive, lastDrawEvent } = useGameSocket();
  // Janela pós-draw_finish calculada NO MESMO render em que drawActive vira false
  // (antes vinha de um useEffect, e por 1 frame a TV mostrava o lobby: a tela de
  // sorteio desmontava e remontava, perdendo o popup do bingo que estava no ar).
  const [holdExpired, setHoldExpired] = useState(false);
  // Tempo extra pedido pelo popup quando há vários ganhadores do BINGO a anunciar
  // (finishHold.ts). A janela conta a partir do draw_finish; se o extra chegar
  // depois, o timer é refeito com o tempo que ainda falta.
  const extraMs = useFinishHoldExtraMs();
  const finishedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (lastDrawEvent !== 'draw_finished') {
      finishedAtRef.current = null;
      return;
    }
    if (finishedAtRef.current === null) {
      finishedAtRef.current = Date.now();
      setHoldExpired(false);
    }
    // Popups pendentes (bingo) + resumo "Ganhadores da Rodada" — ver timing.ts.
    const endsAt = finishedAtRef.current + FINISH_SCREEN_HOLD_MS + extraMs;
    const timer = setTimeout(() => setHoldExpired(true), Math.max(0, endsAt - Date.now()));
    return () => clearTimeout(timer);
  }, [lastDrawEvent, extraMs]);

  const holdingFinishScreen = lastDrawEvent === 'draw_finished' && !holdExpired;
  const shouldShowDraw = drawActive || holdingFinishScreen;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {shouldShowDraw ? <BingoShowDrawScreen /> : <BingoShowLobbyScreen />}
      {/* Promoções só sobre o lobby: quando um sorteio começa (shouldShowDraw), o
          modal é desmontado junto com o lobby — o draw corta a promoção na hora. */}
      {!shouldShowDraw && <BingoShowPromoModal />}
    </div>
  );
};

export default BingoShowLoopScreen;
