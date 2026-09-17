// app/tv/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TvViewport } from '@/components/tv/TvViewport';
import { TvStage } from '@/components/tv/TvStage';
import { TvScreenApp } from '@/components/tvscreen/TvScreenApp';
import { getCredentials, getDefaultIp, getDefaultPort, type SavedCredentials } from '@/storage/credentials';

const DEFAULT_CREDENTIALS: SavedCredentials = {
  ip: getDefaultIp(),
  port: getDefaultPort(),
  pin: '0000',
  roomId: 'test-room',
  roomName: 'TV Bingo Show',
  theme: {},
};

/**
 * `/tv` — rota principal do telão da TV.
 * Inicializa imediatamente com as credenciais (salvas ou padrão) para garantir
 * que NUNCA fique em tela em branco ou presa no carregamento.
 */
import { ThemeSelector } from '@/components/theme';

export default function TvPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<SavedCredentials>(() => {
    return getCredentials() || DEFAULT_CREDENTIALS;
  });

  useEffect(() => {
    const creds = getCredentials();
    if (creds) {
      setCredentials(creds);
    }
  }, []);

  return (
    <TvViewport>
      {/* Seletor Rápido de Temas no Canto Superior (Ícone + Dropdown) */}
      <div
        style={{
          position: 'fixed',
          top: 12,
          right: 16,
          zIndex: 999999,
          pointerEvents: 'auto',
          opacity: 0.95,
          transition: 'opacity 200ms ease',
        }}
      >
        <ThemeSelector variant="dropdown" align="right" />
      </div>


      <TvStage>
        <TvScreenApp credentials={credentials} onLogout={() => router.replace('/config')} />
      </TvStage>
    </TvViewport>
  );
}

