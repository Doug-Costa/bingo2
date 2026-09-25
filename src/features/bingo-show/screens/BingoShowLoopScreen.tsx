/**
 * BingoShowLoopScreen.tsx — Gerenciador do ciclo de telas da TV (Sorteio <-> Lobby).
 *
 * Exibe a tela de sorteio em tempo real (`BingoShowDrawScreen`). Quando o sorteio é
 * concluído (`draw_finish` / `draw_end`), MANTÉM a exibição da tela de sorteio com o
 * Popup Modal dos Ganhadores da Rodada em 3 colunas por EXATAMENTE 20 SEGUNDOS antes
 * de retornar ao Lobby.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useGameSocket } from '@/contexts/SSEContext';
import { BingoShowLobbyScreen } from './BingoShowLobbyScreen';
import { BingoShowDrawScreen } from './BingoShowDrawScreen';
import { FINISH_SCREEN_HOLD_MS } from '../timing';

export const BingoShowLoopScreen: React.FC = () => {
  const { drawActive, lastDrawEvent } = useGameSocket();
  const [holdingFinishScreen, setHoldingFinishScreen] = useState(false);

  useEffect(() => {
    if (lastDrawEvent === 'draw_finished') {
      setHoldingFinishScreen(true);
      const timer = setTimeout(() => {
        setHoldingFinishScreen(false);
      }, FINISH_SCREEN_HOLD_MS); // 20 SEGUNDOS de retenção do Popup dos Ganhadores da Rodada no final do sorteio

      return () => clearTimeout(timer);
    }
  }, [lastDrawEvent]);

  const shouldShowDraw = drawActive || holdingFinishScreen;

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      {shouldShowDraw ? <BingoShowDrawScreen /> : <BingoShowLobbyScreen />}
    </div>
  );
};

export default BingoShowLoopScreen;
