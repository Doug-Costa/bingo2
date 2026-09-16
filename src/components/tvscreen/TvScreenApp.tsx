'use client';

import { useCallback, useMemo, useState } from 'react';
import { GameSocketProvider } from '@/contexts/SSEContext';
import { buildBaseUrl, type SavedCredentials } from '@/storage/credentials';
import { BingoShowLoopScreen } from '@/features/bingo-show/screens/BingoShowLoopScreen';

export interface TvScreenAppProps {
  credentials: SavedCredentials;
  onLogout?: () => void;
}

export function TvScreenApp({ credentials }: TvScreenAppProps) {
  const baseUrl = useMemo(() => buildBaseUrl(credentials.ip, credentials.port), [credentials.ip, credentials.port]);
  const [restartKey, setRestartKey] = useState(0);
  const handleRestart = useCallback(() => setRestartKey((k) => k + 1), []);

  return (
    <GameSocketProvider key={restartKey} baseUrl={baseUrl} roomId={credentials.roomId} pin={credentials.pin} onRestartEvent={handleRestart}>
      <BingoShowLoopScreen />
    </GameSocketProvider>
  );
}

export default TvScreenApp;
