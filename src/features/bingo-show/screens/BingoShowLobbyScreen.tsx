'use client';

/**
 * BingoShowLobbyScreen.tsx — Proxy / Router de exibição do Lobby baseado no tema ativo.
 *
 * Se o tema ativo for 'bingo-show-blue' ou 'blue' (isBlue), renderiza o componente exclusivo BingoShowLobbyScreenBlue.
 * Caso contrário, renderiza o lobby padrão/fallback multi-tema BingoShowLobbyScreenDefault.
 */

import React from 'react';
import { useAppTheme } from '@/contexts/ThemeContext';
import { BingoShowLobbyScreenBlue } from './BingoShowLobbyScreenBlue';
import { BingoShowLobbyScreenDefault } from './BingoShowLobbyScreenDefault';

export const BingoShowLobbyScreen: React.FC = () => {
  const { themeId, isBlue } = useAppTheme();

  const isBlueTheme = isBlue || themeId === 'bingo-show-blue' || themeId === 'blue';

  if (isBlueTheme) {
    return <BingoShowLobbyScreenBlue />;
  }

  return <BingoShowLobbyScreenDefault />;
};

export default BingoShowLobbyScreen;
