/**
 * BingoShowLoopScreen.tsx — Gerenciador do ciclo de telas da TV (Sorteio <-> Lobby).
 *
 * Exibe a tela de sorteio em tempo real (`BingoShowDrawScreen`). Quando o sorteio é
 * concluído (`draw_finish` / `draw_end`), MANTÉM a exibição da tela de sorteio com o
 * popup do bingo (se no ar) e depois o resumo "Ganhadores da Rodada" — janela de
 * FINISH_SCREEN_HOLD_MS (timing.ts) — antes de retornar ao Lobby.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useGameSocket } from '@/contexts/SSEContext';
import { BingoShowLobbyScreen } from './BingoShowLobbyScreen';
import { BingoShowDrawScreen } from './BingoShowDrawScreen';
import { FINISH_SCREEN_HOLD_MS } from '../timing';

export const BingoShowLoopScreen: React.FC = () => {
  const { drawActive, lastDrawEvent } = useGameSocket();
  // Janela pós-draw_finish calculada NO MESMO render em que drawActive vira false
  // (antes vinha de um useEffect, e por 1 frame a TV mostrava o lobby: a tela de
  // sorteio desmontava e remontava, perdendo o popup do bingo que estava no ar).
  const [holdExpired, setHoldExpired] = useState(false);

  useEffect(() => {
    if (lastDrawEvent !== 'draw_finished') return;
    setHoldExpired(false);
    // Popup do bingo (se no ar) + resumo "Ganhadores da Rodada" — ver timing.ts.
    const timer = setTimeout(() => setHoldExpired(true), FINISH_SCREEN_HOLD_MS);
    return () => clearTimeout(timer);
  }, [lastDrawEvent]);

  const holdingFinishScreen = lastDrawEvent === 'draw_finished' && !holdExpired;
  const shouldShowDraw = drawActive || holdingFinishScreen;

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      {shouldShowDraw ? <BingoShowDrawScreen /> : <BingoShowLobbyScreen />}
    </div>
  );
};

export default BingoShowLoopScreen;
