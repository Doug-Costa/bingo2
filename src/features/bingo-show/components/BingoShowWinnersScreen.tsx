/**
 * BingoShowWinnersScreen.tsx — Wrapper unificado dos Ganhadores da Rodada.
 *
 * Elimina duplicidade de código: redireciona para a tela oficial `BingoShowWinnerPopup`
 * com `isDrawFinished={true}`, garantindo um único componente fonte de verdade
 * para todo o sistema (TV, Draw e Rota /winners).
 */
'use client';

import React from 'react';
import { BingoShowWinnerPopup, BingoShowWinnerPopupProps } from './BingoShowWinnerPopup';

export const BingoShowWinnersScreen: React.FC<BingoShowWinnerPopupProps> = (props) => {
  return <BingoShowWinnerPopup {...props} isDrawFinished={true} visibleDurationMs={999999} />;
};

export default BingoShowWinnersScreen;
