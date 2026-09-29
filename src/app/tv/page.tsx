// app/tv/page.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
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

  // Seletor de tema: invisível na TV (não cobre o acumulado do header); aparece
  // quando o mouse se mexe/toca/tecla e some 4s depois (fica enquanto o mouse
  // está sobre ele).
  const [selectorVisible, setSelectorVisible] = useState(false);
  const hoverRef = useRef(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const show = () => {
      setSelectorVisible(true);
      clearTimeout(t);
      t = setTimeout(function hide() {
        if (hoverRef.current) t = setTimeout(hide, 1000);
        else setSelectorVisible(false);
      }, 4000);
    };
    window.addEventListener('mousemove', show);
    window.addEventListener('touchstart', show);
    window.addEventListener('keydown', show);
    return () => {
      clearTimeout(t);
      window.removeEventListener('mousemove', show);
      window.removeEventListener('touchstart', show);
      window.removeEventListener('keydown', show);
    };
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
          pointerEvents: selectorVisible ? 'auto' : 'none',
          opacity: selectorVisible ? 0.95 : 0,
          transition: 'opacity 300ms ease',
        }}
        onMouseEnter={() => (hoverRef.current = true)}
        onMouseLeave={() => (hoverRef.current = false)}
      >
        <ThemeSelector variant="dropdown" align="right" />
      </div>


      <TvStage>
        <TvScreenApp credentials={credentials} onLogout={() => router.replace('/config')} />
      </TvStage>
    </TvViewport>
  );
}

