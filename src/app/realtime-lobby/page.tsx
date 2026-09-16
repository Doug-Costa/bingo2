'use client';

import React from 'react';
import { BingoShowLobbyScreen } from '@/features/bingo-show/screens/BingoShowLobbyScreen';

export default function RealtimeLobbyPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <BingoShowLobbyScreen />
    </div>
  );
}
