'use client';

import React from 'react';
import { BingoShowDrawScreen } from '@/features/bingo-show/screens/BingoShowDrawScreen';

export default function RealtimeDrawPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <BingoShowDrawScreen />
    </div>
  );
}
