'use client';

import { useCallback, useMemo } from 'react';
import { GameSocketProvider, type TvRestartInfo } from '@/contexts/SSEContext';
import { buildBaseUrl, type SavedCredentials } from '@/storage/credentials';
import { getTvConfig } from '@/storage/tvConfig';
import { restartTvFromServer } from '@/services/tvSession';
import { BingoShowLoopScreen } from '@/features/bingo-show/screens/BingoShowLoopScreen';

export interface TvScreenAppProps {
  credentials: SavedCredentials;
  onLogout?: () => void;
}

/** O backend já publica só nos canais certos; isto é só uma defesa extra. */
function isForThisTv(info: TvRestartInfo, roomId: string): boolean {
  if (info.scope === 'room' && info.roomId) {
    return info.roomId === roomId.replace(/^tv_/, '') || info.roomId === roomId;
  }
  if (info.scope === 'reseller' && info.resellerId) {
    const mine = getTvConfig()?.resellerId;
    return !mine || mine === info.resellerId;
  }
  return true;
}

export function TvScreenApp({ credentials }: TvScreenAppProps) {
  const baseUrl = useMemo(() => buildBaseUrl(credentials.ip, credentials.port), [credentials.ip, credentials.port]);

  // Restart remoto: busca tema/idioma/moeda/promoções atuais do PIN e recarrega.
  const handleRestart = useCallback(
    (info: TvRestartInfo) => {
      if (!isForThisTv(info, credentials.roomId)) {
        console.log('[TvScreenApp] tv_restart de outra sala/reseller — ignorado', info);
        return;
      }
      void restartTvFromServer();
    },
    [credentials.roomId],
  );

  return (
    <GameSocketProvider baseUrl={baseUrl} roomId={credentials.roomId} pin={credentials.pin} onRestartEvent={handleRestart}>
      <BingoShowLoopScreen />
    </GameSocketProvider>
  );
}

export default TvScreenApp;
